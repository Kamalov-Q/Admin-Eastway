import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import axiosInstance from "./axios";
import toast from "react-hot-toast";

// ---------- Types ----------
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

export type CityFilters = {
    page?: number;   
    limit?: number;
    name?: string;
    country?: string;
};

export type Paginated<T> = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: T[];
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
};

// ---------- Helpers ----------
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

function clampToPositiveInt(n: number | undefined, fallback: number) {
    const v = Number.isFinite(n as number) ? Number(n) : fallback;
    return v > 0 ? Math.floor(v) : fallback;
}

function normalizeCitiesResponse(
    raw: any,
    params: CityFilters
): Paginated<City> {
    // 1) Array<City>
    if (Array.isArray(raw)) {
        const page = clampToPositiveInt(params.page, 1);
        const limit = clampToPositiveInt(params.limit, raw.length || 10);
        const total = raw.length;
        const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
        return {
            data: raw.map(normalizeCity),
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    // 2) { data: City[], meta: {...} }
    if (raw?.meta && Array.isArray(raw?.data)) {
        const { total, page, limit, totalPages } = raw.meta;
        return {
            data: (raw.data as any[]).map(normalizeCity),
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    // 3) { data: City[], total, page, limit, totalPages }
    if (Array.isArray(raw?.data)) {
        const page = clampToPositiveInt(raw.page, params.page ?? 1);
        const limit = clampToPositiveInt(raw.limit, params.limit ?? 10);
        const total = clampToPositiveInt(raw.total, raw.data.length);
        const totalPages =
            raw.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)));
        return {
            data: (raw.data as any[]).map(normalizeCity),
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    // fallback
    const coerced: City[] = raw ? [normalizeCity(raw)] : [];
    return {
        data: coerced,
        total: coerced.length,
        page: clampToPositiveInt(params.page, 1),
        limit: clampToPositiveInt(params.limit, coerced.length || 10),
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    };
}

// ---------- API ----------
async function fetchCities(filters: CityFilters = {}): Promise<Paginated<City>> {
    const { page, limit, name, country } = filters;
    const params: Record<string, string | number> = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (name?.trim()) params.name = name.trim();
    if (country?.trim()) params.country = country.trim();

    const { data } = await axiosInstance.get("/city", { params });
    return normalizeCitiesResponse(data, filters);
}

export const useCities = (filters: CityFilters = {}) => {
    return useQuery<Paginated<City>>({
        queryKey: ["cities", filters],
        queryFn: () => fetchCities(filters),
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
