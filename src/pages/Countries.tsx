"use client";

import React from "react";
import {
  useCountries,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
  type Country,
} from "@/api/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountriesTable } from "@/components/tables/country-table";
import { CountryFormModal } from "@/components/forms/country-form";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

type ModalMode = "create" | "edit" | "view";

export default function CountriesPage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<ModalMode>("create");
  const [selectedCountry, setSelectedCountry] = React.useState<Country | null>(
    null
  );

  // Toolbar state
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const debouncedSearch = useDebounced(search, 200);

  const {
    data: countriesPage,
    isLoading,
    isError,
    error,
    isFetching,
  } = useCountries({
    name: debouncedSearch || undefined,
    page,
    limit,
  });

  const createCountry = useCreateCountry();
  const updateCountry = useUpdateCountry();
  const deleteCountry = useDeleteCountry();

  const errorNotifiedRef = React.useRef(false);
  React.useEffect(() => {
    if (isError && !errorNotifiedRef.current) {
      toast.error((error as any)?.message ?? "Failed to load countries.");
      errorNotifiedRef.current = true;
    }
  }, [isError, error]);

  const openCreate = () => {
    setSelectedCountry(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEdit = (country: Country) => {
    setSelectedCountry(country);
    setModalMode("edit");
    setModalOpen(true);
  };

  const openView = (country: Country) => {
    setSelectedCountry(country);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleSubmit = async (payload: Partial<Country>) => {
    const cleanPayload = {
      name_en: payload.name_en,
      name_ru: payload.name_ru,
      name_es: payload.name_es,
      name_gr: payload.name_gr,
      name_jp: payload.name_jp,
      name_zh: payload.name_zh,
    };

    if (modalMode === "edit" && selectedCountry) {
      await toast.promise(
        updateCountry.mutateAsync({
          id: selectedCountry.id,
          payload: cleanPayload,
        }),
        {
          loading: "Updating country…",
          success: `Country updated${
            cleanPayload.name_en ? ` (${cleanPayload.name_en})` : ""
          }`,
          error: (e) => (e as any)?.message || "Failed to update country",
        }
      );
    } else if (modalMode === "create") {
      await toast.promise(createCountry.mutateAsync(cleanPayload), {
        loading: "Creating country…",
        success: `Country created${
          cleanPayload.name_en ? ` (${cleanPayload.name_en})` : ""
        }`,
        error: (e) => (e as any)?.message || "Failed to create country",
      });
    }

    setModalOpen(false);
    setSelectedCountry(null);
  };

  const handleDelete = async (id: number) => {
    await toast.promise(deleteCountry.mutateAsync(id), {
      loading: "Deleting country...",
      success: "Country deleted",
      error: (e) => (e as any)?.message || "Failed to delete country",
    });
  };

  const countries = countriesPage?.data ?? [];
  const total = countriesPage?.total ?? 0;
  const totalPages = countriesPage?.totalPages ?? 1;
  const currentPage = countriesPage?.page ?? page;

  const canPrev = countriesPage ? !!countriesPage.hasPrevPage : currentPage > 1;
  const canNext = countriesPage
    ? !!countriesPage.hasNextPage
    : currentPage < totalPages;

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(total, currentPage * limit);

  if (isLoading) return <div className="p-6">Loading countries...</div>;
  if (isError)
    return (
      <div className="p-6 text-red-600">Error: {(error as any)?.message}</div>
    );

  return (
    <div className="p-6 bg-linear-to-b from-gray-50 via-white to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Countries Management</h1>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate}>+ Add Country</Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country..."
            className="w-72"
          />
        </div>
        {/* Rows */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Rows</label>
          <select
            className="border rounded-md py-2 px-2 text-sm"
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

      {/* Table */}
      <div className="rounded-xl shadow-sm bg-white/60 backdrop-blur-md border border-gray-200 p-4 transition-all">
        <CountriesTable
          data={countries}
          onView={openView}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
        {isFetching && (
          <div className="text-xs text-gray-500 mt-2">Refreshing…</div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          {total > 0 ? (
            <>
              Showing <span className="font-medium">{startIndex}</span>–
              <span className="font-medium">{endIndex}</span> of{" "}
              <span className="font-medium">{total}</span>
            </>
          ) : (
            <>No countries found</>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!canPrev || isFetching}
              onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!canNext || isFetching}
              onClick={() => canNext && setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="country-modal"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <CountryFormModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              initialData={selectedCountry ?? undefined}
              onSubmit={handleSubmit}
              mode={modalMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
