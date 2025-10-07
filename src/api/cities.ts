import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axios";
import toast from "react-hot-toast";

export type City = {
    id: number;
    name_ru: string;
    name_en: string;
    name_zh: string;
    name_jp: string;
    name_gr: string;
    name_es: string;
    countryId: number;
};

interface CityFilters {
    page?: number;
    limit?: number;
    name?: string;
    country?: string;
}

export const useCities = (filters: CityFilters = {}) => {
    const { page = 1, limit = 10, name, country } = filters;

    return useQuery<City[]>({
        queryKey: ["cities", { page, limit, name, country }],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, limit };
            if (name?.trim()) params.name = name.trim();
            if (country?.trim()) params.country = country.trim();

            const { data } = await axiosInstance.get("/city", { params });
            return data;
        },
        placeholderData: (prev) => prev,
        staleTime: 1000 * 30,
        refetchOnWindowFocus: false,
    });
};

export const useCreateCity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<City>) => {
            const res = await axiosInstance.post("/city", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cities"] });
            toast.success("City created successfully");
        },
        onError: () => {
            toast.error("Failed to create city");
        },
    });
};

export const useUpdateCity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: Partial<City> }) => {
            const res = await axiosInstance.patch(`/city/${id}`, payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cities"] });
            toast.success("City updated successfully");
        },
        onError: () => {
            toast.error("Failed to update city");
        },
    });
};

export const useDeleteCity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await axiosInstance.delete(`/city/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cities"] });
            toast.success("City deleted successfully");
        },
        onError: () => {
            toast.error("Failed to delete city");
        },
    });
};