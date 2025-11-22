import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export const LANGS = ["en", "ru", "zh", "jp", "gr", "es"] as const;
export type Lang = (typeof LANGS)[number];

export type HotelDistance = {
    place_en: string;
    place_ru?: string;
    place_zh?: string;
    place_jp?: string;
    place_gr?: string;
    place_es?: string;
    distance_km: number;
    duration: number;
};

export type MultiName = {
    name_en: string;
    name_ru?: string;
    name_gr?: string;
    name_jp?: string;
    name_es?: string;
    name_zh?: string;
};

export type Hotel = {
    id: number;

    name_en: string;
    name_ru?: string;
    name_gr?: string;
    name_jp?: string;
    name_es?: string;
    name_zh?: string;

    desc_en?: string;
    desc_ru?: string;
    desc_gr?: string;
    desc_jp?: string;
    desc_es?: string;
    desc_zh?: string;

    address_en?: string;
    address_ru?: string;
    address_gr?: string;
    address_jp?: string;
    address_es?: string;
    address_zh?: string;

    thumbnail?: string;
    images?: { url: string }[];

    distances?: HotelDistance[];

    infos?: MultiName[];
    services?: MultiName[];
    property?: MultiName[];

    cityId: number;

    categoryId: number;
    category?: { id: number; name_en: string };
};

export type HotelsQuery = {
    country?: string;
    name?: string;
    city?: string;
    category?: string;
    limit?: number;
    page?: number;
};

export type PaginationMeta = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
};

export type Paginated<T> = {
    data: T[];
    meta: PaginationMeta;
};

async function fetchHotels(params: HotelsQuery = {}): Promise<Paginated<Hotel>> {
    const q: Record<string, string | number> = {};
    if (params.country?.trim()) q.country = params.country.trim();
    if (params.name?.trim()) q.name = params.name.trim();
    if (params.city?.trim()) q.city = params.city.trim();
    if (params.category?.trim()) q.category = params.category.trim();
    if (typeof params.limit === "number") q.limit = params.limit;
    if (typeof params.page === "number") q.page = params.page;

    const { data } = await axiosInstance.get("/hotels", { params: q });

    // Handle array response (no pagination)
    if (Array.isArray(data)) {
        const page = params.page ?? 1;
        const limit = params.limit ?? (data.length || 10);
        return {
            data,
            meta: {
                total: data.length,
                page,
                limit,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
            },
        };
    }

    // CORRECT: Handle response with meta object (your API format)
    if (data?.meta && data?.data && Array.isArray(data.data)) {
        const meta = data.meta;
        return {
            data: data.data as Hotel[],
            meta: {
                total: Number(meta.total ?? 0),
                page: Number(meta.page ?? params.page ?? 1),
                limit: Number(meta.limit ?? params.limit ?? 10),
                totalPages: Number(meta.totalPages ?? 1),
                hasNextPage: Boolean(meta.hasNextPage),
                hasPrevPage: Boolean(meta.hasPrevPage),
            },
        };
    }

    // FALLBACK: Handle flat structure (legacy)
    if (data?.data && Array.isArray(data.data)) {
        const page = Number(data.page ?? params.page ?? 1);
        const limit = Number(data.limit ?? params.limit ?? (data.data.length || 10));
        const total = Number(data.total ?? data.data.length);
        const totalPages = Number(
            data.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)))
        );
        return {
            data: data.data as Hotel[],
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    // Ultimate fallback
    const fallbackData = (data?.data ?? data ?? []) as Hotel[];
    return {
        data: fallbackData,
        meta: {
            total: fallbackData.length,
            page: params.page ?? 1,
            limit: params.limit ?? (fallbackData.length || 10),
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },
    };
}

export function useHotels(params: HotelsQuery = {}) {
    return useQuery({
        queryKey: ["hotels", params],
        queryFn: () => fetchHotels(params),
        placeholderData: (prev) => prev,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export const useCreateHotel = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<Hotel>) =>
            axiosInstance.post("/hotels", payload).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["hotels"] }),
    });
};

export const useUpdateHotel = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<Hotel> }) =>
            axiosInstance.patch(`/hotels/${id}`, payload).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["hotels"] }),
    });
};

export const useDeleteHotel = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => axiosInstance.delete(`/hotels/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["hotels"] }),
    });
};