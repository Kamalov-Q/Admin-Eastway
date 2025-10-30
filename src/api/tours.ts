import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export const LANGS = ["en", "ru", "gr", "jp", "es", "zh"] as const;
export type Lang = (typeof LANGS)[number];

export type MName = {
    name_en: string;
    name_ru?: string;
    name_gr?: string;
    name_jp?: string;
    name_es?: string;
    name_zh?: string;
};

export type MActivity = {
    day: number;
    activity_en: string;
    activity_ru?: string;
    activity_gr?: string;
    activity_jp?: string;
    activity_es?: string;
    activity_zh?: string;
};

export type Tour = {
    id: number;
    days?: number;
    type?: "private" | "group";
    cityId?: number;
    tourCategoryId?: number;

    thumbnail?: string;
    youtubeLink?: string;
    images?: { url: string }[];

    infos?: MName[];
    routes?: MName[];

    itinerary?: MActivity[];

    price?: {
        amount: number;
        included?: MName[];
        notIncluded?: MName[];
    };

    title_en: string;
    desc_en?: string;
    title_ru?: string;
    desc_ru?: string;
    title_gr?: string;
    desc_gr?: string;
    title_jp?: string;
    desc_jp?: string;
    title_es?: string;
    desc_es?: string;
    title_zh?: string;
    desc_zh?: string;

    address_en?: string;
    address_ru?: string;
    address_gr?: string;
    address_jp?: string;
    address_es?: string;
    address_zh?: string;
};

export type ToursQuery = {
    country?: string;
    name?: string;
    city?: string;
    category?: string;
    type?: "private" | "group";
    limit?: number;
    page?: number;
};

export type Paginated<T> = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: T[];
};

async function fetchTours(params: ToursQuery = {}): Promise<Paginated<Tour>> {
    const q: Record<string, string | number> = {};
    if (params.country?.trim()) q.country = params.country.trim();
    if (params.name?.trim()) q.name = params.name.trim();
    if (params.city?.trim()) q.city = params.city.trim();
    if (params.category?.trim()) q.category = params.category.trim();
    if (params.type) q.type = params.type;
    if (typeof params.limit === "number") q.limit = params.limit;
    if (typeof params.page === "number") q.page = params.page;

    const { data } = await axiosInstance.get("/tours", { params: q });

    if (Array.isArray(data)) {
        const page = params.page ?? 1;
        const limit = params.limit ?? (data.length || 10);
        return { total: data.length, page, limit, totalPages: 1, data };
    }
    if (data?.data && Array.isArray(data.data)) {
        const page = Number(data.page ?? params.page ?? 1);
        const limit = Number(
            data.limit ?? params.limit ?? (data.data.length || 10)
        );
        const total = Number(data.total ?? data.data.length);
        const totalPages = Number(
            data.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)))
        );
        return { total, page, limit, totalPages, data: data.data as Tour[] };
    }
    return {
        total: data?.length ?? 0,
        page: params.page ?? 1,
        limit: params.limit ?? (data?.length ?? 10),
        totalPages: 1,
        data: (data?.data ?? data ?? []) as Tour[],
    };
}

export function useTours(params: ToursQuery = {}) {
    return useQuery({
        queryKey: ["tours", params],
        queryFn: () => fetchTours(params),
        placeholderData: (prev) => prev,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export const useCreateTour = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<Tour>) =>
            axiosInstance.post("/tours", payload).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tours"] }),
    });
};

export const useUpdateTour = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<Tour> }) =>
            axiosInstance.patch(`/tours/${id}`, payload).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tours"] }),
    });
};

export const useDeleteTour = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => axiosInstance.delete(`/tours/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tours"] }),
    });
};
