"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCities, type City } from "@/api/cities";
import type { Country } from "@/api/countries";

const LANGUAGE_FIELDS: { key: keyof Country; label: string }[] = [
  { key: "name_en", label: "English" },
  { key: "name_ru", label: "Russian" },
  { key: "name_es", label: "Spanish" },
  { key: "name_gr", label: "German" },
  { key: "name_jp", label: "Japanese" },
  { key: "name_zh", label: "Chinese" },
];

export function CountryFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  mode = "edit",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData?: Country | null;
  onSubmit: (payload: Partial<Country>) => void;
  mode?: "edit" | "view" | "create";
}) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: initialData ?? {
      name_en: "",
      name_ru: "",
      name_es: "",
      name_gr: "",
      name_jp: "",
      name_zh: "",
    },
  });

  const isViewMode = mode === "view";

  const { data: cities = [], isLoading: citiesLoading } = useCities({
    country: initialData?.name_en ?? "",
    limit: 100,
  });

  React.useEffect(() => {
    reset(
      initialData ?? {
        name_en: "",
        name_ru: "",
        name_es: "",
        name_gr: "",
        name_jp: "",
        name_zh: "",
      }
    );
  }, [initialData, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {mode === "view"
              ? "View Country"
              : mode === "edit"
              ? "Edit Country"
              : "Add Country"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((vals) => {
            onSubmit(vals);
            onOpenChange(false);
          })}
          className="space-y-4"
        >
          {/* Country multilingual fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LANGUAGE_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {field.label}
                </label>
                <Input
                  {...register(field.key)}
                  placeholder={field.label}
                  defaultValue={initialData?.[field.key] ?? ""}
                  readOnly={isViewMode}
                  disabled={isViewMode}
                  className={isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}
                />
              </div>
            ))}
          </div>

          {/* Linked cities (read-only in view mode) */}
          {isViewMode && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Cities in {initialData?.name_en}
              </h3>
              {citiesLoading ? (
                <p className="text-sm text-gray-500">Loading cities...</p>
              ) : cities.length > 0 ? (
                <div className="space-y-2">
                  {cities.map((city: City) => (
                    <div
                      key={city.id}
                      className="rounded-lg border border-gray-200 p-3 bg-white/60"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <span>🇬🇧 {city.name_en}</span>
                        <span>🇷🇺 {city.name_ru}</span>
                        <span>🇪🇸 {city.name_es}</span>
                        <span>🇩🇪 {city.name_gr}</span>
                        <span>🇯🇵 {city.name_jp}</span>
                        <span>🇨🇳 {city.name_zh}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No cities found for this country.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {!isViewMode && (
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {mode === "edit" ? "Update" : "Create"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
