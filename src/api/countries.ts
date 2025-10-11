import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export type Country = {
    id: number;
    name_en: string | null;
    name_ru: string | null;
    name_es: string | null;
    name_gr: string | null;
    name_jp: string | null;
    name_zh: string | null;
};

export type CountriesQuery = {
    name?: string;
    page?: number;
    limit?: number;
};

export type Paginated<T> = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: T[];
};

// ---------- API ----------
export async function getCountries(params: CountriesQuery = {}): Promise<Paginated<Country>> {
    const { data } = await axiosInstance.get("/countries", { params });

    if (Array.isArray(data)) {
        return {
            total: data.length,
            page: params.page ?? 1,
            limit: params.limit ?? (data.length || 10),
            totalPages: 1,
            data,
        };
    }

    return data as Paginated<Country>;
}

export async function createCountry(payload: Partial<Country>): Promise<Country> {
    const { data } = await axiosInstance.post("/countries", payload);
    return data;
}

export async function updateCountry(id: number, payload: Partial<Country>): Promise<Country> {
    const { data } = await axiosInstance.patch(`/countries/${id}`, payload);
    return data;
}

export async function deleteCountry(id: number) {
    const { data } = await axiosInstance.delete(`/countries/${id}`);
    return data;
}

export async function getCountryById(id: number) {
    const { data } = await axiosInstance.get(`/countries/${id}`);
    return data as Country;
}

// ---------- Hooks ----------
export function useCountries(params: CountriesQuery = {}) {
    return useQuery({
        queryKey: ["countries", params],
        queryFn: () => getCountries(params),
        refetchOnWindowFocus: false,
        placeholderData: (prev) => prev
    });
}

export function useCreateCountry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<Country>) => createCountry(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["countries"] }),
    });
}

export function useUpdateCountry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<Country> }) =>
            updateCountry(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["countries"] }),
    });
}

export function useDeleteCountry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteCountry(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["countries"] }),
    });
}

export function useCountryById(id?: number) {
    return useQuery({
        queryKey: ["country", id],
        queryFn: () => getCountryById(id!),
        enabled: !!id,
    });
}
