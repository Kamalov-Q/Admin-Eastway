import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export type Country = {
    id: number;
    name_en: string;
    name_ru?: string;
    name_es?: string;
    name_gr?: string;
    name_jp?: string;
    name_zh?: string;
    city?: []
};

export const useCountries = () =>
    useQuery<Country[]>({ queryKey: ["countries"], queryFn: async () => (await axiosInstance.get("/countries")).data });

export const useCreateCountry = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<Country>) => axiosInstance.post("/countries", payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["countries"] }),
    });
};

export const useUpdateCountry = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<Country> }) =>
            axiosInstance.patch(`/countries/${id}`, payload).then(r => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["countries"] }),
    });
};

export const useDeleteCountry = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => axiosInstance.delete(`/countries/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["countries"] }),
    });
};
