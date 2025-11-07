import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export type ReviewStatus = "pending" | "accepted" | "rejected";

export type Review = {
    id: number;
    author: string;
    comment: string;
    rating: number; 
    status: ReviewStatus;
    type?: "tour" | "hotel";
    tourId?: number | null;
    hotelId?: number | null;
    createdAt?: string;
    tour?: { id: number; title_en?: string };
    hotel?: { id: number; name_en?: string };
};

export type ReviewsQuery = {
    type?: "tour" | "hotel";
    status?: ReviewStatus;
    page?: number;
    limit?: number;
    tourId?: number;
    hotelId?: number;
};

export type Paginated<T> = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: T[];
};

async function fetchReviews(params: ReviewsQuery = {}): Promise<Paginated<Review>> {
    const q: Record<string, string | number> = {};
    if (params.type) q.type = params.type;
    if (params.status) q.status = params.status;
    if (typeof params.page === "number") q.page = params.page;
    if (typeof params.limit === "number") q.limit = params.limit;

    // ✅ only send finite numeric ids
    if (params.type === "tour" && Number.isFinite(params.tourId)) {
        q.tourId = Number(params.tourId);
    }
    if (params.type === "hotel" && Number.isFinite(params.hotelId)) {
        q.hotelId = Number(params.hotelId);
    }

    const { data } = await axiosInstance.get("/reviews", { params: q });

    if (Array.isArray(data)) {
        const page = params.page ?? 1;
        const limit = params.limit ?? (data.length || 10);
        return { total: data.length, page, limit, totalPages: 1, data };
    }
    if (data?.data && Array.isArray(data.data)) {
        const page = Number(data.page ?? params.page ?? 1);
        const limit = Number(data.limit ?? params.limit ?? (data.data.length || 10));
        const total = Number(data.total ?? data.data.length);
        const totalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1))));
        return { total, page, limit, totalPages, data: data.data as Review[] };
    }
    return {
        total: (data?.length ?? 0),
        page: params.page ?? 1,
        limit: params.limit ?? (data?.length ?? 10),
        totalPages: 1,
        data: (data?.data ?? data ?? []) as Review[],
    };
}

export function useReviews(params: ReviewsQuery = {}) {
    // ✅ scalar query key to ensure refetch on type/id changes
    const key = [
        "reviews",
        params.type ?? "all",
        params.status ?? "all",
        params.page ?? 1,
        params.limit ?? 10,
        Number.isFinite(params.tourId) ? Number(params.tourId) : null,
        Number.isFinite(params.hotelId) ? Number(params.hotelId) : null,
    ] as const;

    return useQuery({
        queryKey: key,
        queryFn: () => fetchReviews(params),
        placeholderData: (prev) => prev,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export function useUpdateReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: Exclude<ReviewStatus, "pending"> }) =>
            axiosInstance.patch(`/reviews/${id}`, { status }).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
    });
}