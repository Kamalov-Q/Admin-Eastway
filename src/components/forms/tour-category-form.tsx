"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category } from "@/api/tour-category";

const LANGS = ["en", "ru", "es", "zh", "jp", "gr"] as const;

const schema = z.object({
  name_en: z.string().min(1, "English name is required"),
  name_ru: z.string().optional(),
  name_es: z.string().optional(),
  name_zh: z.string().optional(),
  name_jp: z.string().optional(),
  name_gr: z.string().optional(),
});

type Values = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData?: Category;
  mode?: "create" | "edit" | "view";
  onSubmit: (payload: Partial<Category>) => void | Promise<void>;
};

export function TourCategoryFormModal({
  open,
  onOpenChange,
  initialData,
  mode = initialData ? "edit" : "create",
  onSubmit,
}: Props) {
  const isView = mode === "view";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name_en: initialData?.name_en ?? "",
      name_ru: initialData?.name_ru ?? "",
      name_es: initialData?.name_es ?? "",
      name_zh: initialData?.name_zh ?? "",
      name_jp: initialData?.name_jp ?? "",
      name_gr: initialData?.name_gr ?? "",
    },
  });

  React.useEffect(() => {
    reset({
      name_en: initialData?.name_en ?? "",
      name_ru: initialData?.name_ru ?? "",
      name_es: initialData?.name_es ?? "",
      name_zh: initialData?.name_zh ?? "",
      name_jp: initialData?.name_jp ?? "",
      name_gr: initialData?.name_gr ?? "",
    });
  }, [initialData, reset, open]);

  const ro = isView ? { readOnly: true, disabled: true } : {};

  const submitHandler = async (vals: Values) => {
    if (isView) return onOpenChange(false);
    await onSubmit(vals);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isView
              ? "View Tour Category"
              : initialData
              ? "Edit Tour Category"
              : "Add Tour Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          {LANGS.map((lang) => (
            <div key={lang}>
              <label className="text-sm font-semibold">
                Name ({lang.toUpperCase()})
              </label>
              <Input {...register(`name_${lang}` as const)} {...ro} />
              {lang === "en" && errors.name_en && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.name_en.message}
                </p>
              )}
            </div>
          ))}

          <DialogFooter>
            {isView ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            ) : (
              <Button type="submit">{initialData ? "Update" : "Create"}</Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
