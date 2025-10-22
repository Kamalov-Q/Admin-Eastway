"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Ticket } from "lucide-react";
import toast from "react-hot-toast";

import {
  useTourTariffs,
  useCreateTourTariff,
  useUpdateTourTariff,
  useDeleteTourTariff,
  type TourTariff,
} from "@/api/tour-tariff";
import { TourTariffTable } from "@/components/tables/tour-tariff-table";
import TourTariffForm from "@/components/forms/tour-tariff-form";

export default function TourTariffsPage() {
  const { data, isLoading, isFetching, isError, error } = useTourTariffs();
  const items: TourTariff[] = data ?? [];

  const create = useCreateTourTariff();
  const update = useUpdateTourTariff();
  const remove = useDeleteTourTariff();

  // modal
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit" | "view">("create");
  const [selected, setSelected] = React.useState<TourTariff | null>(null);

  const openCreate = () => {
    setSelected(null);
    setMode("create");
    setOpen(true);
  };
  const openEdit = (t: TourTariff) => {
    setSelected(t);
    setMode("edit");
    setOpen(true);
  };
  const openView = (t: TourTariff) => {
    setSelected(t);
    setMode("view");
    setOpen(true);
  };

  const handleSubmit = async (vals: Partial<TourTariff>) => {
    if (mode === "edit" && selected) {
      await toast.promise(
        update.mutateAsync({ id: selected.id, payload: vals }),
        {
          loading: "Updating tariff…",
          success: "Tariff updated",
          error: (e) => (e as any)?.message || "Failed to update",
        }
      );
    } else {
      await toast.promise(create.mutateAsync(vals as Omit<TourTariff, "id">), {
        loading: "Creating tariff…",
        success: "Tariff created",
        error: (e) => (e as any)?.message || "Failed to create",
      });
    }
    setOpen(false);
    setSelected(null);
  };

  // first-load skeleton
  if (!data && isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-7 w-56 bg-gray-200 rounded" />
        <div className="relative rounded-xl border bg-white p-2">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tour tariffs…
            </div>
          </div>
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError)
    return (
      <div className="p-6 text-red-600">Error: {(error as any)?.message}</div>
    );

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="w-6 h-6" /> Tour Tariffs
        </h1>
        <Button onClick={openCreate}>+ Add Tariff</Button>
      </div>

      {/* table + overlay */}
      <div className="relative rounded-xl border bg-white p-2">
        {isFetching && items.length > 0 && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </div>
          </div>
        )}

        <TourTariffTable
          data={items}
          onView={openView}
          onEdit={openEdit}
          onDelete={(id) => remove.mutateAsync(id) as unknown as Promise<void>}
          isLoadingData={isFetching || isLoading}
          isErrorData={isError}
          errorMessage={(error as any)?.message}
        />
      </div>

      <TourTariffForm
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setSelected(null);
        }}
        initialData={selected}
        mode={mode}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
