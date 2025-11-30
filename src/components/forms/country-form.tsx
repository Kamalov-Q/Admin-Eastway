"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCities, type City, type Paginated } from "@/api/cities";
import type { Country } from "@/api/countries";
import CustomLabel from "../CustomLabel";
import InlineError from "../InlineError";
import { Loader2 } from "lucide-react";

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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isLoading },
  } = useForm({
    defaultValues: initialData ?? {
      name_en: "",
      name_ru: "",
      name_es: "",
      name_gr: "",
      name_jp: "",
      name_zh: "",
    },
  });

  const [loading, setLoading] = useState(false);

  const isView = mode === "view";
  const { data: citiesData = [], isLoading: citiesLoading } = useCities({
    country: initialData?.name_en ?? "",
    limit: 100,
  });

  const cities = Array.isArray(citiesData)
    ? citiesData
    : (citiesData as Paginated<City> | undefined)?.data ?? [];

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

  const submit = handleSubmit(async (vals) => {
    if (!isView && onSubmit) {
      try {
        setLoading(true);
        onSubmit(vals);
        setLoading(false);
        reset();
        onOpenChange(false);
      } catch {
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg"
        onInteractOutside={(e) => e?.preventDefault()}
        onEscapeKeyDown={(e) => e?.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {mode === "view"
              ? "View Country"
              : mode === "edit"
              ? "Edit Country"
              : "Add Country"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LANGUAGE_FIELDS.map((field) => (
              <div key={field.key}>
                <CustomLabel>{field.label}</CustomLabel>
                <Input
                  {...register(field.key, {
                    required:
                      mode !== "view" ? `${field?.label} is required` : false,
                  })}
                  placeholder={field.label}
                  defaultValue={initialData?.[field.key] ?? ""}
                  readOnly={isView}
                  disabled={isView}
                  className={isView ? "bg-gray-50 cursor-not-allowed" : ""}
                />
                <InlineError
                  msg={(errors as any)?.[field?.key]?.message as string}
                />
              </div>
            ))}
          </div>

          {isView && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Cities in {initialData?.name_en}
              </h3>
              {citiesLoading ? (
                <p className="text-sm text-gray-500">Loading cities...</p>
              ) : cities?.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                  {cities?.map((city: City) => (
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
              disabled={loading}
            >
              {isView ? "Close" : "Cancel"}
            </Button>
            {!isView && (
              <Button type="submit" disabled={!isDirty || isLoading || loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                ) : mode == "edit" ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
