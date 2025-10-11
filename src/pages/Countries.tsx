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
import { CountriesTable } from "@/tables/country-table";
import { CountryFormModal } from "@/components/forms/country-form";
import { motion, AnimatePresence } from "framer-motion";

function useDebounced<T>(value: T, delay = 200) {
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
  } = useCountries({
    name: debouncedSearch || undefined,
    page,
    limit,
  });

  const create = useCreateCountry();
  const update = useUpdateCountry();
  const remove = useDeleteCountry();

  const handleSubmit = (payload: Partial<Country>) => {
    const cleanPayload = {
      name_en: payload.name_en,
      name_ru: payload.name_ru,
      name_es: payload.name_es,
      name_gr: payload.name_gr,
      name_jp: payload.name_jp,
      name_zh: payload.name_zh,
    };

    if (modalMode === "edit" && selectedCountry) {
      update.mutate({ id: selectedCountry.id, payload: cleanPayload });
    } else if (modalMode === "create") {
      create.mutate(cleanPayload);
    }
    setModalOpen(false);
  };

  const countries = countriesPage?.data ?? [];
  const total = countriesPage?.total ?? countries.length;
  const totalPages = countriesPage?.totalPages ?? 1;
  const currentPage = countriesPage?.page ?? page;

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  React.useEffect(() => {
    // when search changes, go back to page 1
    setPage(1);
  }, [debouncedSearch]);

  if (isLoading) return <div>Loading countries...</div>;
  if (isError) return <div>Error: {(error as any)?.message}</div>;

  return (
    <div className="p-6 bg-gradient-to-b from-gray-50 via-white to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">
           Countries Management
        </h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setSelectedCountry(null);
              setModalMode("create");
              setModalOpen(true);
            }}
          >
            + Add Country
          </Button>
        </div>
      </div>

      {/* Toolbar (search + page size) */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country..."
            className="w-72"
          />
        </div>
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
          <div className="text-sm text-gray-600 ml-3">
            Total: <span className="font-medium">{total}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl shadow-sm bg-white/60 backdrop-blur-md border border-gray-200 p-4 transition-all">
        <CountriesTable
          data={countries}
          onView={(c) => {
            setSelectedCountry(c);
            setModalMode("view");
            setModalOpen(true);
          }}
          onEdit={(c) => {
            setSelectedCountry({
              id: c.id,
              name_en: c.name_en,
              name_ru: c.name_ru,
              name_es: c.name_es,
              name_gr: c.name_gr,
              name_jp: c.name_jp,
              name_zh: c.name_zh,
            } as Country);
            setModalMode("edit");
            setModalOpen(true);
          }}
          onDelete={(id) => remove.mutate(id)}
        />
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!canPrev}
            onClick={() => canPrev && setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!canNext}
            onClick={() => canNext && setPage((p) => p + 1)}
          >
            Next
          </Button>
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
