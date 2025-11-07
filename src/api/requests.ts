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
    status: RequestStatus; // default may be "active" on server
    type?: "tour" | "hotel"; // derived on BE or by presence of ids
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

export type Paginated<T> = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: T[];
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
        return { total, page, limit, totalPages, data: data.data as Request[] };
    }
    return {
        total: (data?.length ?? 0),
        page: params.page ?? 1,
        limit: params.limit ?? (data?.length ?? 10),
        totalPages: 1,
        data: (data?.data ?? data ?? []) as Request[],
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