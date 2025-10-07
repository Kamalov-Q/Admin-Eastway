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
import { CountriesTable } from "@/tables/country-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CountryFormModal } from "@/components/forms/country-form";
import { motion, AnimatePresence } from "framer-motion";

type ModalMode = "create" | "edit" | "view";

export default function CountriesPage() {
  const { data: countries = [], isLoading, isError, error } = useCountries();
  const create = useCreateCountry();
  const update = useUpdateCountry();
  const remove = useDeleteCountry();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<ModalMode>("create");
  const [selectedCountry, setSelectedCountry] = React.useState<Country | null>(
    null
  );
  const [deleting, setDeleting] = React.useState<Country | null>(null);

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

  const handleDelete = () => {
    if (deleting) {
      remove.mutate(deleting.id, {
        onSuccess: () => setDeleting(null),
      });
    }
  };

  if (isLoading) return <div>Loading countries...</div>;
  if (isError) return <div>Error: {(error as any)?.message}</div>;

  return (
    <div className="p-6 bg-gradient-to-b from-gray-50 via-white to-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          🌍 Countries
        </h1>
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

      <div className="rounded-xl shadow-sm bg-white/60 backdrop-blur-md border border-gray-200 p-4 transition-all">
        <CountriesTable
          data={countries}
          onView={(c) => {
            setSelectedCountry(c);
            setModalMode("view");
            setModalOpen(true);
          }}
          onEdit={(c) => {
            const editableData = {
              id: c.id,
              name_en: c.name_en,
              name_ru: c.name_ru,
              name_es: c.name_es,
              name_gr: c.name_gr,
              name_jp: c.name_jp,
              name_zh: c.name_zh,
            } as Country;
            setSelectedCountry(editableData);
            setModalMode("edit");
            setModalOpen(true);
          }}
          onDelete={(id) => {
            const c = countries.find((x) => x.id === id);
            if (c) setDeleting(c);
          }}
        />
      </div>
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

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="backdrop-blur-md bg-white/70 border border-gray-200 shadow-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-red-600">
              Delete Country
            </DialogTitle>
          </DialogHeader>
          <div className="text-gray-700 mt-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">
              "{deleting?.name_en}"
            </span>
            ?
          </div>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
