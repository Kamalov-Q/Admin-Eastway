import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export type Tour = {
    id: number;
    title_en: string;
    desc_en?: string;
    days?: number;
    type?: string;
    cityId?: number;
    city?: { name_en: string; country?: { name_en: string } };
    price?: { amount: number };
};

export const useTours = () =>
    useQuery<Tour[]>({ queryKey: ["tours"], queryFn: async () => (await axiosInstance.get("/tours")).data });

export const useCreateTour = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<Tour>) => axiosInstance.post("/tours", payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tours"] }),
    });
};

export const useUpdateTour = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<Tour> }) =>
            axiosInstance.put(`/tours/${id}`, payload).then(r => r.data),
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
