import {
    useMutation,
    useQuery,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import axiosInstance from "./axios";

// ---------- Types ----------
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
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
};

// ---------- Helpers ----------
function clampToPositiveInt(n: number | undefined, fallback: number) {
    const v = Number.isFinite(n as number) ? Number(n) : fallback;
    return v > 0 ? Math.floor(v) : fallback;
}

function normalizeCountriesResponse(
    raw: any,
    params: CountriesQuery
): Paginated<Country> {
    if (Array.isArray(raw)) {
        const page = clampToPositiveInt(params.page, 1);
        const limit = clampToPositiveInt(params.limit, raw.length || 10);
        const total = raw.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
            data: raw,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    if (raw?.meta && Array.isArray(raw?.data)) {
        const { total, page, limit, totalPages } = raw.meta;
        return {
            data: raw.data as Country[],
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    if (Array.isArray(raw?.data)) {
        const page = clampToPositiveInt(raw.page, params.page ?? 1);
        const limit = clampToPositiveInt(raw.limit, params.limit ?? 10);
        const total = clampToPositiveInt(raw.total, raw.data.length);
        const totalPages =
            raw.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)));
        return {
            data: raw.data as Country[],
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    const coerced: Country[] = raw ? [raw] : [];
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
export async function getCountries(
    params: CountriesQuery = {}
): Promise<Paginated<Country>> {
    const qp = {
        page: params.page,
        limit: params.limit,
        name: params.name,
    };

    const { data } = await axiosInstance.get("/countries", { params: qp });

    return normalizeCountriesResponse(data, params);
}

export async function createCountry(
    payload: Partial<Country>
): Promise<Country> {
    const { data } = await axiosInstance.post("/countries", payload);
    return data as Country;
}

export async function updateCountry(
    id: number,
    payload: Partial<Country>
): Promise<Country> {
    const { data } = await axiosInstance.patch(`/countries/${id}`, payload);
    return data as Country;
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
    return useQuery<Paginated<Country>>({
        queryKey: ["countries", params],
        queryFn: () => getCountries(params),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
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
