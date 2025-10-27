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

async function fetchTourCategories(): Promise<Category[]> {
  const { data } = await axiosInstance.get("/tour-category");
  if (Array.isArray(data)) return data;
  return data?.data ?? [];
}

export function useTourCategories() {
  return useQuery({
    queryKey: ["tourCategories"],
    queryFn: fetchTourCategories,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateTourCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Category, "id">) =>
      axiosInstance.post("/tour-category", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tourCategories"] }),
  });
}

export function useUpdateTourCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Category> }) =>
      axiosInstance.patch(`/tour-category/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tourCategories"] }),
  });
}

export function useDeleteTourCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/tour-category/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tourCategories"] }),
  });
}
