import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/api/axios";

export type Category = {
  id: number;
  name_en: string;
  name_ru?: string;
  name_es?: string;
  name_zh?: string;
  name_jp?: string;
  name_gr?: string;
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

export type HotelCategoriesQuery = {
  page?: number;
  limit?: number;
};

async function fetchHotelCategories(params: HotelCategoriesQuery = {}): Promise<Paginated<Category>> {
  const q: Record<string, string | number> = {};
  if (typeof params.page === "number") q.page = params.page;
  if (typeof params.limit === "number") q.limit = params.limit;

  const { data } = await axiosInstance.get("/hotel-category", { params: q });

  // CORRECT: Handle response with meta object (your API format)
  if (data?.meta && data?.data && Array.isArray(data.data)) {
    const meta = data.meta;
    return {
      data: data.data as Category[],
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
    const limit = Number(data.limit ?? params.limit ?? 10);
    const total = Number(data.total ?? data.data.length);
    const totalPages = Number(
      data.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)))
    );
    return {
      data: data.data as Category[],
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

  // If API returns just an array (no pagination)
  if (Array.isArray(data)) {
    return {
      data: data as Category[],
      meta: {
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  // Ultimate fallback
  return {
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

export function useHotelCategories(params: HotelCategoriesQuery = {}) {
  return useQuery({
    queryKey: ["hotelCategories", params],
    queryFn: () => fetchHotelCategories(params),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateHotelCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Category, "id">) =>
      axiosInstance.post("/hotel-category", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotelCategories"] }),
  });
}

export function useUpdateHotelCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Category> }) =>
      axiosInstance.patch(`/hotel-category/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotelCategories"] }),
  });
}

export function useDeleteHotelCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/hotel-category/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotelCategories"] }),
  });
}