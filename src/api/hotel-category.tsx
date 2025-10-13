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

async function fetchHotelCategories(): Promise<Category[]> {
  const { data } = await axiosInstance.get("/hotel-category");
  if (Array.isArray(data)) return data;
  return data?.data ?? [];
}

export function useHotelCategories() {
  return useQuery({
    queryKey: ["hotelCategories"],
    queryFn: fetchHotelCategories,
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
