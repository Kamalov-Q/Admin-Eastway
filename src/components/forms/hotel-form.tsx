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
import { useCities } from "@/api/cities";
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

const emptyLangObject = () =>
  LANGS.reduce(
    (acc, lang) => ({ ...acc, [`name_${lang}`]: "" }),
    {} as Record<`name_${Lang}`, string>
  );

const schema = z.object({
  // Required names
  ...LANGS.reduce(
    (acc, lang) => ({
      ...acc,
      [`name_${lang}`]: z
        .string()
        .min(1, `Name (${lang.toUpperCase()}) is required`),
    }),
    {} as Record<`name_${Lang}`, z.ZodString>
  ),

  // Optional desc + address
  ...LANGS.reduce(
    (acc, lang) => ({
      ...acc,
      [`desc_${lang}`]: z.string().optional(),
      [`address_${lang}`]: z.string().optional(),
    }),
    {} as Record<`desc_${Lang}` | `address_${Lang}`, any>
  ),

  cityId: z.number().min(1, "City is required"),
  categoryId: z.number().min(1, "Category is required"),

  // File pickers
  thumbnailFile: z.any().optional(),

  // Distances
  distances: z
    .array(
      z.object({
        place: z.string().min(1, "Place is required"),
        distance_km: z.number().min(0, "Distance must be ≥ 0"),
        duration: z.number().min(0, "Duration must be ≥ 0"),
      })
    )
    .min(1, "Add at least one distance"),

  // Multilingual arrays
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
  /** "create" | "edit" | "view" */
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

  const { data: cities = [], isLoading } = useCities();

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
      distances: [{ place: "", distance_km: 0, duration: 0 }],
      infos: [emptyLangObject()],
      services: [emptyLangObject()],
      property: [emptyLangObject()],
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

  React.useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        cityId: initialData.cityId ?? 0,
        categoryId: initialData.categoryId ?? 0,

        distances: initialData.distances?.length
          ? initialData.distances
          : [{ place: "", distance_km: 0, duration: 0 }],

        infos: initialData.infos?.length
          ? (initialData.infos as any)
          : [emptyLangObject()],
        services: initialData.services?.length
          ? (initialData.services as any)
          : [emptyLangObject()],
        property: initialData.property?.length
          ? (initialData.property as any)
          : [emptyLangObject()],

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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isView) return;
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
      setValue("thumbnailFile", e.target.files as any);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isView) return;
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setNewImageFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setNewImagePreviews((prev) => [...prev, ...newPreviews]);
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

  const onSubmitHandler = async (values: HotelFormValues) => {
    if (isView) {
      onOpenChange(false);
      return;
    }

    // Require a thumbnail like tours
    if (
      !thumbnailPreview &&
      (!values.thumbnailFile || values.thumbnailFile.length === 0) &&
      !initialData?.thumbnail
    ) {
      alert("Thumbnail is required.");
      return;
    }

    let thumbnailUrl = initialData?.thumbnail ?? null;
    if (values.thumbnailFile?.[0]) {
      thumbnailUrl = await uploadThumbnail(values.thumbnailFile[0]);
    }

    let uploadedNewUrls: string[] = [];
    if (newImageFiles.length > 0) {
      uploadedNewUrls = await uploadImages(newImageFiles, "hotels");
    }

    const mergedImages = [
      ...existingImageUrls.map((url) => ({ url })),
      ...uploadedNewUrls.map((url) => ({ url })),
    ];

    // Build the exact backend payload
    const payload: Partial<Hotel> = {
      cityId: values.cityId,
      categoryId: values.categoryId,

      thumbnail: thumbnailUrl ?? undefined,
      images: mergedImages,

      distances: values.distances,
      infos: values.infos,
      services: values.services,
      property: values.property,

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
  };

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

  const selectedCityId = watch("cityId");
  const selectedCity = cities.find((c) => c.id === selectedCityId);

  const ro = isView ? { readOnly: true, disabled: true } : {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {isView ? "View Hotel" : initialData ? "Edit Hotel" : "Add Hotel"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
          {/* ====== Names / Descriptions / Address (6 langs) ====== */}
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

          {/* ====== City / Category ====== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City (searchable; read-only text in view) */}
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
                        : isLoading
                        ? "Loading..."
                        : "Select a city"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search city..." />
                      <CommandEmpty>No city found.</CommandEmpty>
                      <CommandGroup>
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
              {!isView && <InlineError msg={(errors as any).cityId?.message} />}
            </div>

            {/* Category */}
            <div>
              <Label required>Category ID</Label>
              <Input
                type="number"
                {...register("categoryId", { valueAsNumber: true })}
                {...ro}
              />
              {!isView && (
                <InlineError msg={(errors as any).categoryId?.message} />
              )}
            </div>
          </div>

          {/* ====== Thumbnail ====== */}
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

          {/* ====== Images (existing + new previews) ====== */}
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
                  <img src={url} className="w-full h-32 object-cover rounded" />
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
                  <img src={src} className="w-full h-32 object-cover rounded" />
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

          {/* ====== Distances ====== */}
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
                      place: "",
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
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
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
                  <div>
                    <Input
                      placeholder="Place (e.g., Airport)"
                      {...register(`distances.${index}.place` as const)}
                      {...ro}
                    />
                    {!isView && (
                      <InlineError
                        msg={(errors.distances?.[index] as any)?.place?.message}
                      />
                    )}
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Distance (km)"
                      {...register(`distances.${index}.distance_km` as const, {
                        valueAsNumber: true,
                      })}
                      {...ro}
                    />
                    {!isView && (
                      <InlineError
                        msg={
                          (errors.distances?.[index] as any)?.distance_km
                            ?.message
                        }
                      />
                    )}
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Duration (min)"
                      {...register(`distances.${index}.duration` as const, {
                        valueAsNumber: true,
                      })}
                      {...ro}
                    />
                    {!isView && (
                      <InlineError
                        msg={
                          (errors.distances?.[index] as any)?.duration?.message
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!isView && (
              <InlineError msg={(errors as any).distances?.message} />
            )}
          </section>

          {/* ====== Infos / Services / Property ====== */}
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
                    onClick={() => arr.append(emptyLangObject())}
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
