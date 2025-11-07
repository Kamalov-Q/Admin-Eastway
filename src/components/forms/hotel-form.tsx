"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Hotel } from "@/api/hotels";
import { LANGS, type Lang } from "@/api/hotels";
import { uploadImages, uploadThumbnail } from "@/api/upload";
import { X, Plus, Trash2, Check } from "lucide-react";
import { useCities, type City } from "@/api/cities";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useHotelCategories } from "@/api/hotel-category";

/* ---------- helpers ---------- */
const emptyNameObject = () =>
  LANGS.reduce(
    (acc, lang) => ({ ...acc, [`name_${lang}`]: "" }),
    {} as Record<`name_${Lang}`, string>
  );

const emptyPlaceObject = () =>
  LANGS.reduce(
    (acc, lang) => ({ ...acc, [`place_${lang}`]: "" }),
    {} as Record<`place_${Lang}`, string>
  );

/* ---------- schema ---------- */
const schema = z.object({
  ...LANGS.reduce(
    (acc, lang) => ({
      ...acc,
      [`name_${lang}`]: z
        .string()
        .min(1, `Name (${lang.toUpperCase()}) is required`),
    }),
    {} as Record<`name_${Lang}`, z.ZodString>
  ),

  ...LANGS.reduce(
    (acc, lang) => ({
      ...acc,
      [`desc_${lang}`]: z.string().optional(),
      [`address_${lang}`]: z.string().optional(),
    }),
    {} as Record<`desc_${Lang}` | `address_${Lang}`, z.ZodOptional<z.ZodString>>
  ),

  cityId: z.coerce.number().int().min(1, "City is required"),
  categoryId: z.coerce.number().int().min(1, "Category is required"),

  thumbnailFile: z.any().optional(),

  distances: z
    .array(
      z
        .object({
          ...LANGS.reduce(
            (acc, lang) => ({
              ...acc,
              [`place_${lang}`]: z
                .string()
                .min(1, `Place (${lang.toUpperCase()}) is required`),
            }),
            {} as Record<`place_${Lang}`, z.ZodString>
          ),
          distance_km: z.coerce.number().min(0, "Distance must be ≥ 0"),
          duration: z.coerce.number().min(0, "Duration must be ≥ 0"),
        })
        .strict()
    )
    .min(1, "Add at least one distance"),

  infos: z
    .array(
      z.object(
        LANGS.reduce(
          (acc, lang) => ({
            ...acc,
            [`name_${lang}`]: z
              .string()
              .min(1, `${lang.toUpperCase()} item is required`),
          }),
          {} as Record<`name_${Lang}`, z.ZodString>
        )
      )
    )
    .min(1, "Add at least one info"),

  services: z
    .array(
      z.object(
        LANGS.reduce(
          (acc, lang) => ({
            ...acc,
            [`name_${lang}`]: z
              .string()
              .min(1, `${lang.toUpperCase()} item is required`),
          }),
          {} as Record<`name_${Lang}`, z.ZodString>
        )
      )
    )
    .min(1, "Add at least one service"),

  property: z
    .array(
      z.object(
        LANGS.reduce(
          (acc, lang) => ({
            ...acc,
            [`name_${lang}`]: z
              .string()
              .min(1, `${lang.toUpperCase()} item is required`),
          }),
          {} as Record<`name_${Lang}`, z.ZodString>
        )
      )
    )
    .min(1, "Add at least one property"),
});

export type HotelFormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  initialData?: Hotel | null;
  onSubmit: (values: Partial<Hotel>) => Promise<void> | void;
  mode?: "create" | "edit" | "view";
};

export function HotelFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  mode,
}: Props) {
  const effectiveMode: "create" | "edit" | "view" =
    mode ?? (initialData ? "edit" : "create");
  const isView = effectiveMode === "view";

  const [thumbnailPreview, setThumbnailPreview] = React.useState<string | null>(
    null
  );
  const [newImageFiles, setNewImageFiles] = React.useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = React.useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = React.useState<string[]>(
    []
  );

  /* -------- cities (normalize to City[]) -------- */
  const { data: citiesRaw, isLoading: citiesLoading } = useCities({
    limit: 20,
  });
  const cities: City[] = Array.isArray(citiesRaw)
    ? (citiesRaw as City[])
    : (citiesRaw as any)?.data ?? [];

  /* -------- categories (normalize to array) -------- */
  const {
    data: categoriesRaw,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useHotelCategories();
  const categories: Array<{ id: number; name_en?: string }> = Array.isArray(
    categoriesRaw
  )
    ? (categoriesRaw as any[])
    : (categoriesRaw as any)?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    setValue,
    watch,
  } = useForm<HotelFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cityId: 0,
      categoryId: 0,
      distances: [{ ...emptyPlaceObject(), distance_km: 0, duration: 0 }],
      infos: [emptyNameObject()],
      services: [emptyNameObject()],
      property: [emptyNameObject()],
      ...LANGS.reduce(
        (acc, lang) => ({
          ...acc,
          [`name_${lang}`]: "",
          [`desc_${lang}`]: "",
          [`address_${lang}`]: "",
        }),
        {} as Record<string, string>
      ),
    },
  });

  const distancesArray = useFieldArray({ control, name: "distances" });
  const infosArray = useFieldArray({ control, name: "infos" });
  const servicesArray = useFieldArray({ control, name: "services" });
  const propertyArray = useFieldArray({ control, name: "property" });

  /* -------- hydrate form when opening -------- */
  React.useEffect(() => {
    if (!open) return;

    if (initialData) {
      const normalizedDistances =
        (initialData.distances || []).map((d: any) => ({
          place_en: d.place_en ?? d.place ?? "",
          place_ru: d.place_ru ?? "",
          place_zh: d.place_zh ?? "",
          place_jp: d.place_jp ?? "",
          place_gr: d.place_gr ?? "",
          place_es: d.place_es ?? "",
          distance_km: Number(d.distance_km ?? 0),
          duration: Number(d.duration ?? 0),
        })) || [];

      reset({
        cityId: initialData.cityId ?? 0,
        categoryId: initialData.categoryId ?? 0,
        distances:
          normalizedDistances.length > 0
            ? normalizedDistances
            : [{ ...emptyPlaceObject(), distance_km: 0, duration: 0 }],
        infos: initialData.infos?.length
          ? (initialData.infos as any)
          : [emptyNameObject()],
        services: initialData.services?.length
          ? (initialData.services as any)
          : [emptyNameObject()],
        property: initialData.property?.length
          ? (initialData.property as any)
          : [emptyNameObject()],
        ...LANGS.reduce(
          (acc, lang) => ({
            ...acc,
            [`name_${lang}`]: (initialData as any)[`name_${lang}`] ?? "",
            [`desc_${lang}`]: (initialData as any)[`desc_${lang}`] ?? "",
            [`address_${lang}`]: (initialData as any)[`address_${lang}`] ?? "",
          }),
          {} as Record<string, string>
        ),
      });

      setThumbnailPreview(initialData.thumbnail ?? null);
      setExistingImageUrls(initialData.images?.map((i) => i.url) ?? []);
      setNewImageFiles([]);
      setNewImagePreviews([]);
    } else {
      setThumbnailPreview(null);
      setExistingImageUrls([]);
      setNewImageFiles([]);
      setNewImagePreviews([]);
    }
  }, [open, initialData, reset]);

  /* -------- file handlers -------- */
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isView) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
      setValue("thumbnailFile", e.target.files as any);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isView) return;
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    setNewImageFiles((prev) => [...prev, ...files]);

    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          })
      )
    ).then((urls) => setNewImagePreviews((prev) => [...prev, ...urls]));
  };

  const removeExistingImage = (url: string) => {
    if (isView) return;
    setExistingImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const removeNewImage = (index: number) => {
    if (isView) return;
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uniqueByUrl = (arr: { url: string }[]) => {
    const seen = new Set<string>();
    return arr.filter((i) => {
      if (seen.has(i.url)) return false;
      seen.add(i.url);
      return true;
    });
  };

  /* -------- submit -------- */
  const onSubmitHandler = handleSubmit(async (values) => {
    if (isView) {
      onOpenChange(false);
      return;
    }

    if (
      !thumbnailPreview &&
      (!values.thumbnailFile || (values.thumbnailFile as any).length === 0) &&
      !initialData?.thumbnail
    ) {
      alert("Thumbnail is required.");
      return;
    }

    let thumbnailUrl = initialData?.thumbnail ?? null;
    if ((values as any).thumbnailFile?.[0]) {
      thumbnailUrl = await uploadThumbnail((values as any).thumbnailFile[0]);
    }

    let uploadedNewUrls: string[] = [];
    if (newImageFiles.length > 0) {
      uploadedNewUrls = await uploadImages(newImageFiles, "hotels");
    }

    const mergedImages = uniqueByUrl([
      ...existingImageUrls.map((url) => ({ url })),
      ...uploadedNewUrls.map((url) => ({ url })),
    ]);

    interface DistancePayload {
      place_en: string;
      place_ru: string;
      place_zh: string;
      place_jp: string;
      place_gr: string;
      place_es: string;
      distance_km: number;
      duration: number;
    }

    interface MultilingualName {
      name_en: string;
      name_ru: string;
      name_zh: string;
      name_jp: string;
      name_gr: string;
      name_es: string;
    }

    const payload: Partial<Hotel> & {
      images: { url: string }[];
      distances: DistancePayload[];
      infos: MultilingualName[];
      services: MultilingualName[];
      property: MultilingualName[];
    } = {
      cityId: Number(values.cityId),
      categoryId: Number(values.categoryId),
      thumbnail: thumbnailUrl ?? undefined,
      images: mergedImages,
      distances: values.distances.map(
        (d: any): DistancePayload => ({
          place_en: (d.place_en || "").trim(),
          place_ru: (d.place_ru || "").trim(),
          place_zh: (d.place_zh || "").trim(),
          place_jp: (d.place_jp || "").trim(),
          place_gr: (d.place_gr || "").trim(),
          place_es: (d.place_es || "").trim(),
          distance_km: Number(d.distance_km) || 0,
          duration: Number(d.duration) || 0,
        })
      ),
      infos: values.infos.map((row: any): MultilingualName => ({ ...row })),
      services: values.services.map(
        (row: any): MultilingualName => ({
          ...row,
        })
      ),
      property: values.property.map(
        (row: any): MultilingualName => ({
          ...row,
        })
      ),
      ...LANGS.reduce(
        (acc, lang) => ({
          ...acc,
          [`name_${lang}`]: (values as any)[`name_${lang}`],
          [`desc_${lang}`]: (values as any)[`desc_${lang}`],
          [`address_${lang}`]: (values as any)[`address_${lang}`],
        }),
        {}
      ),
    };

    await onSubmit(payload);
    onOpenChange(false);
  });

  /* -------- UI helpers -------- */
  const Label = ({
    children,
    required,
  }: {
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <label className="font-semibold">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const InlineError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-red-500 text-xs mt-1">{msg}</p> : null;

  const ro = isView ? { readOnly: true, disabled: true } : {};
  const selectedCityId = watch("cityId");
  const selectedCity = cities.find((c) => c.id === selectedCityId);

  const selectedCategoryId = watch("categoryId");
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {isView ? "View Hotel" : initialData ? "Edit Hotel" : "Add Hotel"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmitHandler} className="space-y-6">
          {/* multilingual core fields */}
          <div className="space-y-4">
            {LANGS.map((lang) => (
              <div key={lang} className="border rounded-lg p-3 space-y-2">
                <label className="font-semibold">
                  Name ({lang.toUpperCase()})
                </label>
                <Input {...register(`name_${lang}` as const)} {...ro} />
                {!isView && (
                  <InlineError msg={(errors as any)[`name_${lang}`]?.message} />
                )}

                <label className="font-semibold">
                  Description ({lang.toUpperCase()})
                </label>
                <Input {...register(`desc_${lang}` as const)} {...ro} />

                <label className="font-semibold">
                  Address ({lang.toUpperCase()})
                </label>
                <Input {...register(`address_${lang}` as const)} {...ro} />
              </div>
            ))}
          </div>

          {/* City / Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City */}
            <div>
              <Label required>City</Label>
              {isView ? (
                <Input
                  value={
                    selectedCity
                      ? `${selectedCity.name_en}${
                          selectedCity.name_ru
                            ? ` - ${selectedCity.name_ru}`
                            : ""
                        }`
                      : initialData?.cityId
                      ? String(initialData.cityId)
                      : ""
                  }
                  readOnly
                  disabled
                />
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedCity
                        ? `${selectedCity.name_en}${
                            selectedCity.name_ru
                              ? ` - ${selectedCity.name_ru}`
                              : ""
                          }`
                        : citiesLoading
                        ? "Loading..."
                        : "Select a city"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search city..." />
                      <CommandEmpty>No city found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto hover:overflow-y-auto">
                        {cities.map((city) => (
                          <CommandItem
                            key={city.id}
                            value={`${city.name_en} ${city.name_ru || ""}`}
                            onSelect={() =>
                              setValue("cityId", city.id, {
                                shouldValidate: true,
                              })
                            }
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                city.id === selectedCityId
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {city.name_en}
                            {city.name_ru ? ` - ${city.name_ru}` : ""}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {!isView && <InlineError msg={errors.cityId?.message} />}
            </div>

            {/* Category */}
            <div>
              <Label required>Category</Label>
              {isView ? (
                <Input
                  value={
                    selectedCategory?.name_en ||
                    (initialData?.categoryId
                      ? String(initialData.categoryId)
                      : "")
                  }
                  readOnly
                  disabled
                />
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedCategory
                        ? selectedCategory?.name_en
                        : categoriesLoading
                        ? "Loading..."
                        : categoriesError
                        ? "Failed to load categories"
                        : "Select a category"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto hover:overflow-y-auto">
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={`${cat.name_en ?? ""}`}
                            onSelect={() =>
                              setValue("categoryId", cat.id, {
                                shouldValidate: true,
                              })
                            }
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                cat.id === selectedCategoryId
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {cat?.name_en ?? `#${cat.id}`}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {!isView && <InlineError msg={errors.categoryId?.message} />}
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <Label required>Thumbnail</Label>
            {!isView && (
              <Input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
              />
            )}
            {thumbnailPreview && (
              <img
                src={thumbnailPreview}
                alt="thumbnail"
                className="w-48 h-32 mt-2 object-cover rounded"
              />
            )}
            {!thumbnailPreview && initialData?.thumbnail && (
              <img
                src={initialData.thumbnail}
                alt="thumbnail"
                className="w-48 h-32 mt-2 object-cover rounded"
              />
            )}
          </div>

          {/* Images */}
          <div>
            <Label>Hotel Images</Label>
            {!isView && (
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
              />
            )}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {existingImageUrls.map((url) => (
                <div key={url} className="relative group">
                  <img
                    src={url}
                    alt=""
                    className="w-full h-32 object-cover rounded"
                  />
                  {!isView && (
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-90"
                      title="Remove"
                      onClick={() => removeExistingImage(url)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {newImagePreviews.map((src, idx) => (
                <div key={`new-${idx}`} className="relative group">
                  <img
                    src={src}
                    alt=""
                    className="w-full h-32 object-cover rounded"
                  />
                  {!isView && (
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-90"
                      title="Remove"
                      onClick={() => removeNewImage(idx)}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Distances */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label required>Distances</Label>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    distancesArray.append({
                      ...emptyPlaceObject(),
                      distance_km: 0,
                      duration: 0,
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add distance
                </Button>
              )}
            </div>

            {distancesArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Distance #{index + 1}</p>
                  {!isView && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => distancesArray.remove(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <div key={lang}>
                      <Input
                        placeholder={`Place (${lang.toUpperCase()})`}
                        {...register(
                          `distances.${index}.place_${lang}` as const
                        )}
                        {...ro}
                      />
                      {!isView && (
                        <InlineError
                          msg={
                            errors?.distances?.[index]?.[
                              `place_${lang}` as keyof (typeof errors.distances)[0]
                            ]?.message
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Distance (km)"
                      {...register(`distances.${index}.distance_km` as const)}
                      {...ro}
                    />
                    {!isView && (
                      <InlineError
                        msg={errors?.distances?.[index]?.distance_km?.message}
                      />
                    )}
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Duration (min)"
                      {...register(`distances.${index}.duration` as const)}
                      {...ro}
                    />
                    {!isView && (
                      <InlineError
                        msg={errors?.distances?.[index]?.duration?.message}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!isView && (
              <InlineError
                msg={errors.distances?.message as string | undefined}
              />
            )}
          </section>

          {/* Infos / Services / Property */}
          {[
            { label: "Infos", arr: infosArray, name: "infos" as const },
            {
              label: "Services",
              arr: servicesArray,
              name: "services" as const,
            },
            {
              label: "Property",
              arr: propertyArray,
              name: "property" as const,
            },
          ].map(({ label, arr, name }) => (
            <section className="space-y-3" key={name}>
              <div className="flex items-center justify-between">
                <Label required>{label}</Label>
                {!isView && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => arr.append(emptyNameObject())}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add {label.toLowerCase()}
                  </Button>
                )}
              </div>
              {arr.fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">
                      {label} #{index + 1}
                    </p>
                    {!isView && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => arr.remove(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {LANGS.map((lang) => (
                      <div key={lang}>
                        <Input
                          placeholder={`${label.slice(
                            0,
                            -1
                          )} ${lang.toUpperCase()}`}
                          {...register(
                            `${name}.${index}.name_${lang}` as const
                          )}
                          {...ro}
                        />
                        {!isView && (
                          <InlineError
                            msg={
                              (errors as any)?.[name]?.[index]?.[`name_${lang}`]
                                ?.message
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!isView && (
                <InlineError msg={(errors as any)?.[name]?.message} />
              )}
            </section>
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
