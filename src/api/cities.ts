// src/api/cities.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import axiosInstance from "./axios"; // keep your existing axios instance import
import toast from "react-hot-toast";

export type City = {
    id: number;
    name_ru: string;
    name_en: string;
    name_zh: string;
    name_jp: string;
    name_gr: string;
    name_es: string;
    countryId: number;
};

export type CityPayload = Pick<
    City,
    "name_en" | "name_ru" | "name_es" | "name_gr" | "name_jp" | "name_zh" | "countryId"
>;

interface CityFilters {
    page?: number;
    limit?: number;
    name?: string;
    country?: string; // optional filter by country name (server can handle it in where.country)
}

/** Keep only the 6 language fields + countryId. Drop everything else. */
export const sanitizeCityPayload = (p: Partial<City>): Partial<CityPayload> => {
    const base: Partial<CityPayload> = {
        name_en: p.name_en?.trim(),
        name_ru: p.name_ru?.trim(),
        name_es: p.name_es?.trim(),
        name_gr: p.name_gr?.trim(),
        name_jp: p.name_jp?.trim(),
        name_zh: p.name_zh?.trim(),
        countryId: p.countryId,
    };
    return Object.fromEntries(Object.entries(base).filter(([, v]) => v !== undefined));
};

/** Normalize any raw city (possibly with relations) to the thin City shape. */
const normalizeCity = (raw: any): City => ({
    id: raw.id,
    name_en: raw.name_en ?? "",
    name_ru: raw.name_ru ?? "",
    name_es: raw.name_es ?? "",
    name_gr: raw.name_gr ?? "",
    name_jp: raw.name_jp ?? "",
    name_zh: raw.name_zh ?? "",
    countryId:
        typeof raw.countryId === "number" ? raw.countryId : raw.country?.id ?? undefined,
});

export const useCities = (filters: CityFilters = {}) => {
    const { page = 1, limit = 10, name, country } = filters;

    return useQuery<City[]>({
        queryKey: ["cities", { page, limit, name, country }],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, limit };
            if (name?.trim()) params.name = name.trim();
            if (country?.trim()) params.country = country.trim();

            const { data } = await axiosInstance.get("/city", { params });
            // Accept array or { data: [] }
            const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
            return rows.map(normalizeCity);
        },
        // v5: keeps previous data during refetch
        placeholderData: keepPreviousData,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
};

export const useCreateCity = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<City>) => {
            const body = sanitizeCityPayload(payload);
            const res = await axiosInstance.post("/city", body);
            return normalizeCity(res.data);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cities"] });
            toast.success("City created successfully");
        },
        onError: () => toast.error("Failed to create city"),
    });
};

export const useUpdateCity = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: Partial<City> }) => {
            const body = sanitizeCityPayload(payload);
            const res = await axiosInstance.patch(`/city/${id}`, body);
            return normalizeCity(res.data);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cities"] });
            toast.success("City updated successfully");
        },
        onError: () => toast.error("Failed to update city"),
    });
};

export const useDeleteCity = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await axiosInstance.delete(`/city/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cities"] });
            toast.success("City deleted successfully");
        },
        onError: () => toast.error("Failed to delete city"),
    });
};
