import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export type RequestItem = {
    id: number;
    userName?: string;
    hotel?: { name_en: string };
    tour?: { title_en: string };
    status?: string;
};

export const useRequests = () =>
    useQuery<RequestItem[]>({ queryKey: ["requests"], queryFn: async () => (await axiosInstance.get("/requests")).data });

export const useCreateRequest = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<RequestItem>) => axiosInstance.post("/requests", payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
    });
};

export const useUpdateRequest = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<RequestItem> }) =>
            axiosInstance.put(`/requests/${id}`, payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
    });
};

export const useDeleteRequest = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => axiosInstance.delete(`/requests/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
    });
};
