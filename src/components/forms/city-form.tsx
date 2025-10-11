// src/components/forms/city-form.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { City } from "@/api/cities";
import { useCountries, type Country } from "@/api/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CityPayloadSchema = z.object({
  name_en: z.string().trim().optional(),
  name_ru: z.string().trim().optional(),
  name_es: z.string().trim().optional(),
  name_gr: z.string().trim().optional(),
  name_jp: z.string().trim().optional(),
  name_zh: z.string().trim().optional(),
  countryId: z.number({ error: "Country is required" }),
});
type CityFormValues = z.infer<typeof CityPayloadSchema>;

const LANGUAGE_FIELDS: { key: keyof CityFormValues; label: string }[] = [
  { key: "name_en", label: "English" },
  { key: "name_ru", label: "Russian" },
  { key: "name_es", label: "Spanish" },
  { key: "name_gr", label: "German" },
  { key: "name_jp", label: "Japanese" },
  { key: "name_zh", label: "Chinese" },
];

export function CityFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  mode = "create",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData?: City | null;
  onSubmit?: (payload: Partial<City>) => void;
  mode?: "edit" | "view" | "create";
}) {
  const countriesQuery = useCountries();
  const raw = countriesQuery.data as any;
  const countries: Country[] = Array.isArray(raw) ? raw : raw?.data ?? [];

  const isView = mode === "view";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CityFormValues>({
    resolver: zodResolver(CityPayloadSchema),
    defaultValues: {
      name_en: "",
      name_ru: "",
      name_es: "",
      name_gr: "",
      name_jp: "",
      name_zh: "",
      countryId: initialData?.countryId, // default from initial record
    },
  });

  const selectedCountryId = watch("countryId");

  // Reset form when modal opens or data changes (only on our whitelisted fields)
  useEffect(() => {
    if (open) {
      reset({
        name_en: initialData?.name_en ?? "",
        name_ru: initialData?.name_ru ?? "",
        name_es: initialData?.name_es ?? "",
        name_gr: initialData?.name_gr ?? "",
        name_jp: initialData?.name_jp ?? "",
        name_zh: initialData?.name_zh ?? "",
        countryId: initialData?.countryId,
      });
    }
  }, [initialData, open, reset]);

  const submit = handleSubmit((vals) => {
    if (!isView && onSubmit) {
      // vals is already strictly the 6 langs + countryId
      onSubmit(vals);
      reset();
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle>
            {mode === "view"
              ? "City Details"
              : mode === "edit"
              ? "Edit City"
              : "Add City"}
          </DialogTitle>
        </DialogHeader>

        {countriesQuery.isLoading ? (
          <div className="p-4 text-gray-500">Loading countries...</div>
        ) : countriesQuery.isError ? (
          <div className="p-4 text-red-500">
            Failed to load countries. Please retry.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {/* Country selector */}
            <div>
              <label className="text-sm font-medium">Country</label>
              {isView ? (
                <div className="p-2 border rounded bg-gray-50">
                  {countries.find((c) => c.id === selectedCountryId)?.name_en ??
                    "N/A"}
                </div>
              ) : (
                <>
                  <Select
                    value={
                      selectedCountryId ? String(selectedCountryId) : undefined
                    }
                    onValueChange={(v) =>
                      setValue("countryId", Number(v), { shouldValidate: true })
                    }
                    disabled={isView}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          No countries found
                        </div>
                      ) : (
                        countries.map((country) => (
                          <SelectItem
                            key={country.id}
                            value={country.id.toString()}
                          >
                            {country.name_en}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.countryId && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.countryId.message}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Language fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LANGUAGE_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm font-medium">{label}</label>
                  {isView ? (
                    <div className="p-2 border rounded bg-gray-50 text-gray-700">
                      {(initialData as any)?.[key] || "N/A"}
                    </div>
                  ) : (
                    <>
                      <Input
                        {...register(key)}
                        placeholder={label}
                        disabled={isView}
                      />
                      {errors[key] && (
                        <p className="mt-1 text-xs text-red-600">
                          {String(errors[key]?.message)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {isView ? "Close" : "Cancel"}
              </Button>

              {!isView && (
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {mode === "edit" ? "Update" : "Create"}
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
