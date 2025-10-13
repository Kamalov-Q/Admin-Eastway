// src/components/forms/tour-tariff-scrollable.tsx
"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import type { TourTariff } from "@/api/tour-tariff";
import type { Tour } from "@/api/tours";
import { useTours } from "@/api/tours";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, Plus, Trash2, X } from "lucide-react";

// ---------- schema ----------
const priceEntrySchema = z.object({
  id: z.number().optional(),
  person: z.number().min(1, "Person must be ≥ 1"),
  amount: z.number().min(0, "Amount must be ≥ 0"),
});

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  priceEntries: z
    .array(priceEntrySchema)
    .min(1, "Add at least one price entry"),
  tourIds: z.array(z.number()).min(1, "Attach at least one tour"),
});

export type TourTariffFormValues = z.infer<typeof schema>;

// ---------- props ----------
type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData?: TourTariff | null;
  mode?: "create" | "edit" | "view";
  onSubmit: (payload: Partial<TourTariff>) => void | Promise<void>;
};

export default function TourTariffForm({
  open,
  onOpenChange,
  initialData,
  mode,
  onSubmit,
}: Props) {
  const effectiveMode: "create" | "edit" | "view" =
    mode ?? (initialData ? "edit" : "create");
  const isView = effectiveMode === "view";

  // 1) Prefill from initialData.tours if present
  const prelinkedTourIds = React.useMemo<number[]>(
    () =>
      Array.from(
        new Set(
          (initialData?.tours ?? [])
            .map((x: any) => Number(x?.tourId))
            .filter((n) => Number.isFinite(n))
        )
      ),
    [initialData?.tours]
  );

  // 2) Load tours for multi-select (supports array or paginated)
  const toursQuery = useTours({ limit: 1000 });
  const d = toursQuery.data as any;
  const tours: Tour[] = React.useMemo(() => {
    return Array.isArray(d) ? d : d?.data ?? [];
  }, [d]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TourTariffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      priceEntries: initialData?.priceEntries?.length
        ? initialData.priceEntries.map((p: any) => ({
            id: p.id,
            person: Number(p.person) || 1,
            amount: Number(p.amount) || 0,
          }))
        : [{ person: 1, amount: 0 }],
      // Prefer IDs coming from the tariff GET 'tours' relation
      tourIds: prelinkedTourIds,
    },
  });

  React.useEffect(() => {
    reset({
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      priceEntries: initialData?.priceEntries?.length
        ? initialData.priceEntries.map((p: any) => ({
            id: p.id,
            person: Number(p.person) || 1,
            amount: Number(p.amount) || 0,
          }))
        : [{ person: 1, amount: 0 }],
      tourIds: prelinkedTourIds,
    });
  }, [initialData, prelinkedTourIds, reset, open]);

  const priceArray = useFieldArray({ control, name: "priceEntries" });
  const ro = isView ? { readOnly: true, disabled: true } : {};

  const onSubmitHandler = async (vals: TourTariffFormValues) => {
    if (isView) {
      onOpenChange(false);
      return;
    }
    await onSubmit(vals);
    onOpenChange(false);
  };

  // Selection state
  const selectedIds = watch("tourIds") ?? [];

  // 3) Selected chip labels: prefer toursQuery; fallback to initialData.tours titles
  const chipItems = React.useMemo(() => {
    const map = new Map<number, string>();

    // From query
    for (const id of selectedIds) {
      const t = tours.find((x) => Number(x.id) === Number(id));
      if (t) {
        const label = (t as any).title_en || (t as any).title_ru || `#${t.id}`;
        map.set(Number(id), label);
      }
    }

    // Fallback from initialData.tours
    for (const link of initialData?.tours ?? []) {
      const id = Number(link?.id);
      if (!Number.isFinite(id)) continue;
      if (selectedIds.includes(id) && !map.has(id)) {
        const label = link?.title_en || `#${id}`;
        map.set(id, label);
      }
    }

    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [selectedIds, tours, initialData?.tours]);

  const [openTours, setOpenTours] = React.useState(false);

  const toggleTour = (id: number) => {
    if (isView) return;
    const exists = selectedIds.includes(id);
    const next = exists
      ? selectedIds.filter((x: number) => x !== id)
      : [...selectedIds, id];
    setValue("tourIds", next, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div
          className={[
            "rounded-xl bg-white",
            "grid grid-rows-[auto,1fr,auto] overflow-hidden",
            "h-[85dvh] md:h-[90vh]",
          ].join(" ")}
        >
          {/* Header */}
          <div className="border-b px-6 py-4 bg-white/90 backdrop-blur">
            <h3 className="text-lg font-semibold">
              {isView
                ? "View Tour Tariff"
                : initialData
                ? "Edit Tour Tariff"
                : "Add Tour Tariff"}
            </h3>
          </div>

          {/* Body (scrollable) */}
          <form onSubmit={handleSubmit(onSubmitHandler)} className="contents">
            <div className="px-6 py-4 overflow-y-auto overscroll-contain">
              {/* Basic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold">Name</label>
                  <Input {...register("name")} {...ro} />
                  {!isView && errors.name && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="font-semibold">Description</label>
                  <Textarea rows={3} {...register("description")} {...ro} />
                </div>
              </div>

              {/* Price Entries */}
              <section className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <label className="font-semibold">Price Entries</label>
                  {!isView && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        priceArray.append({ person: 1, amount: 0 })
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add row
                    </Button>
                  )}
                </div>

                {priceArray.fields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3">
                    <div className="col-span-5 md:col-span-3">
                      <label className="text-sm">Person</label>
                      <Input
                        type="number"
                        {...register(`priceEntries.${idx}.person` as const, {
                          valueAsNumber: true,
                        })}
                        {...ro}
                      />
                      {!isView && errors.priceEntries?.[idx]?.person && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.priceEntries[idx]?.person?.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-5 md:col-span-3">
                      <label className="text-sm">Amount</label>
                      <Input
                        type="number"
                        {...register(`priceEntries.${idx}.amount` as const, {
                          valueAsNumber: true,
                        })}
                        {...ro}
                      />
                      {!isView && errors.priceEntries?.[idx]?.amount && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.priceEntries[idx]?.amount?.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 md:col-span-2 flex items-end">
                      {!isView && (
                        <Button
                          variant="destructive"
                          size="icon"
                          type="button"
                          onClick={() => priceArray.remove(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {!isView && (errors.priceEntries as any)?.message && (
                  <p className="text-xs text-red-600">
                    {(errors.priceEntries as any)?.message}
                  </p>
                )}
              </section>

              {/* Tours Multi-Select */}
              <section className="space-y-2 mt-4">
                <label className="font-semibold">Attach to Tours</label>
                <Popover open={openTours} onOpenChange={setOpenTours}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      disabled={isView || toursQuery.isLoading}
                    >
                      {toursQuery.isLoading
                        ? "Loading tours…"
                        : selectedIds.length
                        ? `${selectedIds.length} selected`
                        : "Select tour(s)"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="w-[420px] p-0 max-h-[60vh] overflow-y-auto overscroll-contain"
                  >
                    <Command>
                      <CommandInput placeholder="Search tours…" />
                      <CommandEmpty>No tours found.</CommandEmpty>
                      <CommandGroup>
                        {tours.map((t) => {
                          const checked = selectedIds.includes(t.id as number);
                          const label =
                            (t as any).title_en ||
                            (t as any).title_ru ||
                            `#${t.id}`;
                          return (
                            <CommandItem
                              key={t.id}
                              value={label}
                              onSelect={() => toggleTour(Number(t.id))}
                              className="flex items-center justify-between"
                            >
                              <div className="truncate">{label}</div>
                              <Check
                                className={`h-4 w-4 ${
                                  checked ? "opacity-100" : "opacity-0"
                                }`}
                              />
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected chips (instant labels from initialData fallback) */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {chipItems.map(({ id, label }) => (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {label}
                      {!isView && (
                        <button
                          type="button"
                          className="ml-1 hover:opacity-70"
                          onClick={() => toggleTour(id)}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>

                {!isView && (errors.tourIds as any)?.message && (
                  <p className="text-xs text-red-600">
                    {(errors.tourIds as any)?.message}
                  </p>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-3 bg-white/90 backdrop-blur flex items-center justify-end gap-2">
              {isView ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {initialData ? "Update" : "Create"}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
