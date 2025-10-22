// app/(your-route)/cities/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCities,
  useDeleteCity,
  useCreateCity,
  useUpdateCity,
  type City,
} from "@/api/cities";
import { CitiesTable } from "@/components/tables/cities-table";
import { CityFormModal } from "@/components/forms/city-form";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function CitiesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const {
    data: cities,
    isLoading,
    isFetching,
    isError,
    error,
  } = useCities({
    page,
    limit,
    name: debouncedSearch,
  });

  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();

  useEffect(() => setPage(1), [debouncedSearch]);

  // One-time toast for query errors
  const errorNotifiedRef = useRef(false);
  useEffect(() => {
    if (isError && !errorNotifiedRef.current) {
      toast.error((error as any)?.message ?? "Failed to load cities.");
      errorNotifiedRef.current = true;
    }
  }, [isError, error]);

  const openCreate = () => {
    setSelectedCity(null);
    setModalMode("create");
    setModalOpen(true);
  };
  const openEdit = (city: City) => {
    setSelectedCity(city);
    setModalMode("edit");
    setModalOpen(true);
  };
  const openView = (city: City) => {
    setSelectedCity(city);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleSubmit = async (
    payload: Partial<City>,
    mode: "create" | "edit",
    city?: City | null
  ) => {
    if (mode === "edit" && city?.id) {
      await toast.promise(
        updateCity.mutateAsync(
          { id: city.id, payload } // your hook sanitizes fields
        ),
        {
          loading: "Updating city…",
          success: `City updated${
            payload?.name_en ? ` (${payload.name_en})` : ""
          }`,
          error: (e) => (e as any)?.message || "Failed to update city",
        }
      );
    } else {
      await toast.promise(createCity.mutateAsync(payload), {
        loading: "Creating city…",
        success: `City created${
          payload?.name_en ? ` (${payload.name_en})` : ""
        }`,
        error: (e) => (e as any)?.message || "Failed to create city",
      });
    }
    setModalOpen(false);
    setSelectedCity(null);
  };

  const handleDelete = async (id: number) => {
    await toast.promise(deleteCity.mutateAsync(id), {
      loading: "Deleting city…",
      success: "City deleted",
      error: (e) => (e as any)?.message || "Failed to delete city",
    });
  };

  if (!cities && isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Skeleton className="h-9 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        <div className="border rounded-lg p-2 bg-white">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 border-b last:border-b-0"
            >
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-5 w-56" />
              <div className="ml-auto flex items-center gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600">Error: {(error as any)?.message}</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cities Management</h1>
        <Button onClick={openCreate}>+ Add City</Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          placeholder="Search city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rows per page:</label>
          <select
            className="border rounded-md py-1.5 px-2 text-sm"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table + subtle overlay while fetching */}
      <div className="relative border rounded-lg p-2 bg-white">
        {isFetching && (cities?.length ?? 0) > 0 && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </div>
          </div>
        )}

        <CitiesTable
          data={cities || []}
          onView={openView}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>

      <CityFormModal
        open={modalOpen}
        initialData={selectedCity}
        mode={modalMode}
        onOpenChange={(v) => {
          if (!v) {
            setModalOpen(false);
            setSelectedCity(null);
          } else {
            setModalOpen(true);
          }
        }}
        onSubmit={(payload) =>
          modalMode !== "view" &&
          handleSubmit(payload, modalMode as "create" | "edit", selectedCity)
        }
      />
    </div>
  );
}
