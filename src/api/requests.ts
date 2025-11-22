import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export type RequestStatus = "active" | "passive";

export type Request = {
    id: number;
    firstName: string;
    lastName: string;
    citizenship?: string;
    email?: string;
    phone?: string;
    travelers?: number;
    comment?: string;
    status: RequestStatus;
    type?: "tour" | "hotel";
    tourId?: number | null;
    hotelId?: number | null;
    createdAt?: string;

    tour?: { id: number; title_en?: string };
    hotel?: { id: number; name_en?: string };
};

export type RequestsQuery = {
    type?: "tour" | "hotel";
    status?: RequestStatus;
    page?: number;
    limit?: number;
    tourId?: number;
    hotelId?: number;
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

async function fetchRequests(params: RequestsQuery = {}): Promise<Paginated<Request>> {
    const q: Record<string, string | number> = {};
    if (params.type) q.type = params.type;
    if (params.status) q.status = params.status;
    if (typeof params.page === "number") q.page = params.page;
    if (typeof params.limit === "number") q.limit = params.limit;

    if (params.type === "tour" && Number.isFinite(params.tourId)) {
        q.tourId = Number(params.tourId);
    }
    if (params.type === "hotel" && Number.isFinite(params.hotelId)) {
        q.hotelId = Number(params.hotelId);
    }

    const { data } = await axiosInstance.get("/requests", { params: q });

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
            data: data.data as Request[],
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
            data: data.data as Request[],
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
    const fallbackData = (data?.data ?? data ?? []) as Request[];
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

export function useRequests(params: RequestsQuery = {}) {
    const key = [
        "requests",
        params.type ?? "all",
        params.status ?? "all",
        params.page ?? 1,
        params.limit ?? 10,
        Number.isFinite(params.tourId) ? Number(params.tourId) : null,
        Number.isFinite(params.hotelId) ? Number(params.hotelId) : null,
    ] as const;

    return useQuery({
        queryKey: key,
        queryFn: () => fetchRequests(params),
        placeholderData: (prev) => prev,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export function useUpdateRequestStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: RequestStatus }) =>
            axiosInstance.patch(`/requests/${id}/status`, { status }).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
    });
}