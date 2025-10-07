"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCities, useDeleteCity } from "@/api/cities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/api/axios";
import { CitiesTable } from "@/tables/cities-table";
import type { City } from "@/api/cities";
import { CityFormModal } from "@/components/forms/city-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CitiesPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);

  const queryClient = useQueryClient();

  // Fetch cities
  const { data, isLoading } = useCities({ page, limit, name: search });

  // Create / Update mutation
  const mutation = useMutation({
    mutationFn: async ({
      payload,
      mode,
      city,
    }: {
      payload: Partial<City>;
      mode: "create" | "edit";
      city?: City | null;
    }) => {
      if (mode === "edit" && city?.id) {
        return axiosInstance.patch(`/city/${city.id}`, payload);
      }
      return axiosInstance.post("/city", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      setModalOpen(false);
      setSelectedCity(null);
    },
  });

  const deleteMutation = useDeleteCity();

  // Handlers
  const handleCreate = () => {
    setSelectedCity(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleEdit = (city: City) => {
    setSelectedCity(city);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleView = (city: City) => {
    setSelectedCity(city);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleDeleteClick = (city: City) => {
    setCityToDelete(city);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!cityToDelete) return;
    deleteMutation.mutate(cityToDelete.id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setCityToDelete(null);
      },
    });
  };

  const handleSubmit = (
    payload: Partial<City>,
    mode: "create" | "edit",
    city?: City | null
  ) => {
    const filtered = {
      name_en: payload.name_en ?? city?.name_en ?? "",
      name_ru: payload.name_ru ?? city?.name_ru ?? "",
      name_es: payload.name_es ?? city?.name_es ?? "",
      name_gr: payload.name_gr ?? city?.name_gr ?? "",
      name_jp: payload.name_jp ?? city?.name_jp ?? "",
      name_zh: payload.name_zh ?? city?.name_zh ?? "",
      countryId: payload.countryId ?? city?.countryId,
    };

    mutation.mutate({ payload: filtered, mode, city });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cities</h1>
        <Button onClick={handleCreate}>+ Add City</Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search city..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      <div className="border rounded-lg p-2">
        {isLoading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <CitiesTable
            data={data || []}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={(id) => {
              const city = data?.find((c: City) => c.id === id);
              if (city) handleDeleteClick(city);
            }}
          />
        )}
      </div>

      <CityFormModal
        open={modalOpen}
        initialData={selectedCity}
        mode={modalMode}
        onOpenChange={(v) => {
          if (!v) {
            setModalOpen(false);
            setSelectedCity(null);
          }
        }}
        onSubmit={(payload) =>
          modalMode !== "view" &&
          handleSubmit(payload, modalMode as "create" | "edit", selectedCity)
        }
      />

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{cityToDelete?.name_en}</span>? This
            action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
