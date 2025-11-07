import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
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
    page?: number; // 1-based
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

// ---------- helpers ----------
function clampToPositiveInt(n: number | undefined, fallback: number) {
    const v = Number.isFinite(n as number) ? Number(n) : fallback;
    return v > 0 ? Math.floor(v) : fallback;
}

function normalizeToursResponse(
    raw: any,
    params: ToursQuery
): Paginated<Tour> {
    // 1) Array<Tour>
    if (Array.isArray(raw)) {
        const page = clampToPositiveInt(params.page, 1);
        const limit = clampToPositiveInt(params.limit, raw.length || 10);
        const total = raw.length;
        const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
        return {
            data: raw as Tour[],
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    // 2) { data: Tour[], meta: {...} }
    if (raw?.meta && Array.isArray(raw?.data)) {
        const { total, page, limit, totalPages } = raw.meta;
        return {
            data: raw.data as Tour[],
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    // 3) { data: Tour[], total, page, limit, totalPages }
    if (Array.isArray(raw?.data)) {
        const page = clampToPositiveInt(raw.page, params.page ?? 1);
        const limit = clampToPositiveInt(raw.limit, params.limit ?? 10);
        const total = clampToPositiveInt(raw.total, raw.data.length);
        const totalPages =
            raw.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)));
        return {
            data: raw.data as Tour[],
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    // fallback
    const list: Tour[] = raw?.data ?? raw ?? [];
    const page = clampToPositiveInt(params.page, 1);
    const limit = clampToPositiveInt(params.limit, list.length || 10);
    const total = Array.isArray(list) ? list.length : 0;
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

    return {
        data: Array.isArray(list) ? list : [],
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}

// ---------- API ----------
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
    return normalizeToursResponse(data, params);
}

export function useTours(params: ToursQuery = {}) {
    return useQuery<Paginated<Tour>>({
        queryKey: ["tours", params],
        queryFn: () => fetchTours(params),
        placeholderData: keepPreviousData, // v5-friendly pagination UX
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export const useCreateTour = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<Tour>) =>
            axiosInstance.post("/tours", payload).then((r) => r.data as Tour),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tours"] }),
    });
};

export const useUpdateTour = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<Tour> }) =>
            axiosInstance.patch(`/tours/${id}`, payload).then((r) => r.data as Tour),
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
