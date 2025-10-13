import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/api/axios";
import type { Tour } from "./tours";

export type PriceEntry = {
    id?: number;
    person: number;
    amount: number;
};

export type TourTariff = {
    id: number;
    name: string;
    description?: string;
    priceEntries: PriceEntry[];
    tourIds: number[];
    tours?: Tour[]
};

async function fetchTariffs(): Promise<TourTariff[]> {
    const { data } = await axiosInstance.get("/tariff");
    if (Array.isArray(data)) return data;
    return data?.data ?? [];
}

export function useTourTariffs() {
    return useQuery({
        queryKey: ["tourTariffs"],
        queryFn: fetchTariffs,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

export function useCreateTourTariff() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Omit<TourTariff, "id">) =>
            axiosInstance.post("/tariff", payload).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tourTariffs"] }),
    });
}

export function useUpdateTourTariff() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<TourTariff> }) =>
            axiosInstance.patch(`/tariff/${id}`, payload).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tourTariffs"] }),
    });
}

export function useDeleteTourTariff() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => axiosInstance.delete(`/tariff/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tourTariffs"] }),
    });
}
