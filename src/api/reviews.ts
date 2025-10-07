import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export type Review = {
    id: number;
    text?: string;
    rating?: number;
    hotel?: { name_en: string };
    tour?: { title_en: string };
};

export const useReviews = () =>
    useQuery<Review[]>({ queryKey: ["reviews"], queryFn: async () => (await axiosInstance.get("/reviews")).data });

export const useCreateReview = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<Review>) => axiosInstance.post("/reviews", payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
    });
};

export const useUpdateReview = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<Review> }) =>
            axiosInstance.put(`/reviews/${id}`, payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
    });
};

export const useDeleteReview = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => axiosInstance.delete(`/reviews/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
    });
};
