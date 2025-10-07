import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export type Hotel = {
    id: number;
    name_en: string;
    cityId?: number;
    city?: { name_en: string; country?: { name_en: string } };
    category?: { name_en: string };
};

export const useHotels = () =>
    useQuery<Hotel[]>({ queryKey: ["hotels"], queryFn: async () => (await axiosInstance.get("/hotels")).data });

export const useCreateHotel = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<Hotel>) => axiosInstance.post("/hotels", payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["hotels"] }),
    });
};

export const useUpdateHotel = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<Hotel> }) =>
            axiosInstance.put(`/hotels/${id}`, payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["hotels"] }),
    });
};

export const useDeleteHotel = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => axiosInstance.delete(`/hotels/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["hotels"] }),
    });
};
