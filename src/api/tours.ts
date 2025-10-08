import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";

export type Tour = {
    id: number;
    days?: number;
    type?: string;
    cityId?: number;
    tourCategoryId?: number;
    thumbnail?: string;
    youtubeLink?: string;
    images?: { url: string }[];
    infos?: { name_en: string; name_ru?: string; name_gr?: string; name_jp?: string; name_es?: string; name_zh?: string }[];
    routes?: { name_en: string; name_ru?: string; name_gr?: string; name_jp?: string; name_es?: string; name_zh?: string }[];
    itinerary?: { day: number; activity: string }[];
    price?: {
        amount: number;
        included?: { name_en: string; name_ru?: string; name_gr?: string; name_jp?: string; name_es?: string; name_zh?: string }[];
        notIncluded?: { name_en: string; name_ru?: string; name_gr?: string; name_jp?: string; name_es?: string; name_zh?: string }[];
    };
    title_en: string;
    desc_en?: string;
    title_ru?: string;
    desc_ru?: string;
    title_gr?: string;
    desc_gr?: string;
    title_jp?: string;
    desc_jp?: string;
    title_es?: string;
    desc_es?: string;
    title_zh?: string;
    desc_zh?: string;
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
            axiosInstance.patch(`/tours/${id}`, payload).then(r => r.data),
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
