"use client";

import * as React from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
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
import { uploadImages, uploadThumbnail } from "@/api/upload";
import { Plus, Trash2, Check, X, Loader2 } from "lucide-react";

import { useCities } from "@/api/cities";
import { useTourCategories, type Category } from "@/api/tour-category";
import type { Tour } from "@/api/tours";

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
import InlineError from "../InlineError";
import CustomLabel from "../CustomLabel";

const LANGS = ["en", "ru", "gr", "jp", "es", "zh"] as const;
type Lang = (typeof LANGS)[number];

const emptyNameObj = () =>
  LANGS.reduce(
    (acc, lang) => ({ ...acc, [`name_${lang}`]: "" }),
    {} as Record<`name_${Lang}`, string>
  );

const emptyActivityObj = () =>
  LANGS.reduce(
    (acc, lang) => ({ ...acc, [`activity_${lang}`]: "" }),
    {} as Record<`activity_${Lang}`, string>
  );

const schema = z.object({
  days: z.coerce.number().min(1, "Days is required"),
  type: z.enum(["private", "group"] as const, {
    message: "Tour type is required",
  }),
  cityId: z.coerce.number().int().min(1, "City is required"),
  categoryId: z.coerce.number().int().min(1, "Category is required"),
  youtubeLink: z
    .union([z.string().url("Must be a valid YouTube URL"), z.literal("")])
    .optional(),
  thumbnailFile: z.any().optional(),

  infos: z
    .array(
      z.object(
        LANGS.reduce(
          (acc, lang) => ({ ...acc, [`name_${lang}`]: z.string().optional() }),
          {} as Record<`name_${Lang}`, z.ZodString>
        )
      )
    )
    .optional(),

  routes: z
    .array(
      z.object(
        LANGS.reduce(
          (acc, lang) => ({ ...acc, [`name_${lang}`]: z.string().optional() }),
          {} as Record<`name_${Lang}`, z.ZodString>
        )
      )
    )
    .optional(),

  itinerary: z
    .array(
      z.object({
        day: z.coerce.number().min(1),
        ...LANGS.reduce(
          (acc, lang) => ({
            ...acc,
            [`activity_${lang}`]: z.string().optional(),
          }),
          {}
        ),
      })
    )
    .min(1),
  priceAmount: z.coerce.number().min(1, "Price is required"),
  priceIncluded: z
    .array(
      z.object(
        LANGS.reduce(
          (acc, lang) => ({ ...acc, [`name_${lang}`]: z.string().optional() }),
          {} as Record<`name_${Lang}`, z.ZodString>
        )
      )
    )
    .optional(),
  priceNotIncluded: z
    .array(
      z.object(
        LANGS.reduce(
          (acc, lang) => ({ ...acc, [`name_${lang}`]: z.string().optional() }),
          {} as Record<`name_${Lang}`, z.ZodString>
        )
      )
    )
    .optional(),

  ...LANGS.reduce(
    (acc, lang) => ({
      ...acc,
      [`title_${lang}`]: z.string().min(1),
      [`desc_${lang}`]: z.string().optional(),
      [`address_${lang}`]: z.string().optional(),
    }),
    {} as Record<`title_${Lang}` | `desc_${Lang}` | `address_${Lang}`, any>
  ),
});

export type TourFormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  initialData?: Tour | null;
  onSubmit: (values: Partial<Tour>) => Promise<void> | void;
  mode?: "create" | "edit" | "view";
};

export function TourFormModal({
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

  const { data: citiesPage, isLoading: citiesLoading } = useCities({
    page: 1,
    limit: 100,
  });
  const cities = citiesPage?.data ?? [];

  const [loading, setLoading] = React.useState(false);

  const tourCatsQuery = useTourCategories();

  const categories: Category[] = React.useMemo(() => {
    const raw = tourCatsQuery.data as any;
    return Array.isArray(raw) ? raw : raw?.data ?? [];
  }, [tourCatsQuery.data]);

  const categoryLabel = (c?: Category) =>
    c
      ? c.name_en ||
        c.name_ru ||
        c.name_es ||
        c.name_gr ||
        c.name_jp ||
        c.name_zh ||
        `#${c.id}`
      : "";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isLoading },
    control,
    reset,
    setValue,
    watch,
  } = useForm<TourFormValues>({
    resolver: zodResolver(schema) as Resolver<TourFormValues>,
    defaultValues: {
      days: initialData?.days ?? 1,
      type: (initialData?.type as any) ?? ("" as any),
      cityId: initialData?.cityId ?? 0,

      categoryId: initialData?.categoryId ?? undefined,

      youtubeLink: initialData?.youtubeLink ?? "",
      infos: initialData?.infos?.length
        ? (initialData.infos as any)
        : [emptyNameObj()],
      routes: initialData?.routes?.length
        ? (initialData.routes as any)
        : [emptyNameObj()],
      itinerary: initialData?.itinerary?.length
        ? (initialData.itinerary as any)
        : [{ day: 1, ...emptyActivityObj() }],
      priceAmount: initialData?.price?.amount ?? 1,
      priceIncluded: initialData?.price?.included?.length
        ? (initialData.price.included as any)
        : [emptyNameObj()],
      priceNotIncluded: initialData?.price?.notIncluded?.length
        ? (initialData.price.notIncluded as any)
        : [emptyNameObj()],
      ...LANGS.reduce(
        (acc, lang) => ({
          ...acc,
          [`title_${lang}`]: (initialData as any)?.[`title_${lang}`] ?? "",
          [`desc_${lang}`]: (initialData as any)?.[`desc_${lang}`] ?? "",
          [`address_${lang}`]: (initialData as any)?.[`address_${lang}`] ?? "",
        }),
        {} as Record<string, string>
      ),
    },
  });

  const infosArray = useFieldArray({ control, name: "infos" });
  const routesArray = useFieldArray({ control, name: "routes" });
  const itineraryArray = useFieldArray({ control, name: "itinerary" });
  const priceIncludedArray = useFieldArray({ control, name: "priceIncluded" });
  const priceNotIncludedArray = useFieldArray({
    control,
    name: "priceNotIncluded",
  });

  React.useEffect(() => {
    if (!open) return;
    if (!initialData) return;
    if (!categories?.length) return;

    reset({
      days: initialData.days,
      type: initialData.type,
      cityId: initialData.cityId,
      categoryId: initialData.categoryId,
      youtubeLink: initialData.youtubeLink ?? "",
      infos: initialData.infos?.length ? initialData.infos : [emptyNameObj()],
      routes: initialData.routes?.length
        ? initialData.routes
        : [emptyNameObj()],
      itinerary: initialData.itinerary?.length
        ? initialData.itinerary
        : [{ day: 1, ...emptyActivityObj() }],
      priceAmount: initialData.price?.amount ?? 1,
      priceIncluded: initialData.price?.included?.length
        ? initialData.price.included
        : [emptyNameObj()],
      priceNotIncluded: initialData.price?.notIncluded?.length
        ? initialData.price.notIncluded
        : [emptyNameObj()],
      ...LANGS.reduce(
        (acc, lang) => ({
          ...acc,
          [`title_${lang}`]: initialData[`title_${lang}`] ?? "",
          [`desc_${lang}`]: initialData[`desc_${lang}`] ?? "",
          [`address_${lang}`]: initialData[`address_${lang}`] ?? "",
        }),
        {}
      ),
    });

    setThumbnailPreview(initialData.thumbnail ?? null);
    setExistingImageUrls(initialData.images?.map((i) => i.url) ?? []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
  }, [open, initialData, categories]);

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
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewImagePreviews((prev) => [...prev, ...previews]);
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

  const ro = isView ? { readOnly: true, disabled: true } : {};

  const TYPE_OPTIONS = [
    { value: "private", label: "Private" },
    { value: "group", label: "Group" },
  ] as const;

  const getTypeLabel = (v?: string | null) =>
    TYPE_OPTIONS.find((o) => o.value === v)?.label ?? "";

  const onSubmitHandler = async (values: TourFormValues) => {
    if (isView) {
      onOpenChange(false);
      return;
    }

    if (
      !thumbnailPreview &&
      (!(values as any).thumbnailFile ||
        (values as any).thumbnailFile.length === 0) &&
      !initialData?.thumbnail
    ) {
      alert("Thumbnail is required.");
      return;
    }

    let thumbnailUrl = initialData?.thumbnail ?? null;
    const fileList = (values as any).thumbnailFile as FileList | undefined;
    if (fileList?.[0]) {
      setLoading(true);
      thumbnailUrl = await uploadThumbnail(fileList[0]);
      setLoading(false);
    }

    let uploadedNewUrls: string[] = [];
    if (newImageFiles.length > 0) {
      setLoading(true);
      uploadedNewUrls = await uploadImages(newImageFiles, "tours");
      setLoading(false);
    }

    const mergedImages = [
      ...existingImageUrls.map((url) => ({ url })),
      ...uploadedNewUrls.map((url) => ({ url })),
    ];

    const payload: Partial<Tour> = {
      days: values.days,
      type: values.type,
      cityId: values.cityId,
      categoryId: values.categoryId,
      youtubeLink: values.youtubeLink || undefined,
      thumbnail: thumbnailUrl ?? undefined,
      images: mergedImages,

      infos: values.infos,
      routes: values.routes,

      itinerary: values.itinerary.map((it) => ({
        day: it.day,
        activity_en: (it as any).activity_en,
        activity_ru: (it as any).activity_ru,
        activity_gr: (it as any).activity_gr,
        activity_jp: (it as any).activity_jp,
        activity_es: (it as any).activity_es,
        activity_zh: (it as any).activity_zh,
      })) as any,

      price: {
        amount: values.priceAmount,
        included: values.priceIncluded,
        notIncluded: values.priceNotIncluded,
      },

      ...LANGS.reduce(
        (acc, lang) => ({
          ...acc,
          [`title_${lang}`]: (values as any)[`title_${lang}`],
          [`desc_${lang}`]: (values as any)[`desc_${lang}`],
          [`address_${lang}`]: (values as any)[`address_${lang}`],
        }),
        {}
      ),
    };

    setLoading(true);
    await onSubmit(payload);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto p-6"
        onInteractOutside={(e) => e?.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isView ? "View Tour" : initialData ? "Edit Tour" : "Add Tour"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
          {/* Multilingual fields */}
          <div className="space-y-4">
            {LANGS.map((lang) => (
              <div key={lang} className="border rounded-lg p-3 space-y-2">
                <label className="font-semibold">
                  Title ({lang.toUpperCase()})
                </label>
                <Input
                  {...register(`title_${lang}` as const)}
                  {...ro}
                  placeholder={`Title in ${lang}`}
                />
                <label className="font-semibold">
                  Description ({lang.toUpperCase()})
                </label>
                <Input
                  {...register(`desc_${lang}` as const)}
                  {...ro}
                  placeholder={`Description in ${lang}`}
                />
                <label className="font-semibold">
                  Address ({lang.toUpperCase()})
                </label>
                <Input
                  {...register(`address_${lang}` as const)}
                  {...ro}
                  placeholder={`Address in ${lang}`}
                />
              </div>
            ))}
          </div>

          {/* Basics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CustomLabel required>Days</CustomLabel>
              <Input
                min={1}
                type="number"
                {...register("days", { valueAsNumber: true })}
                {...ro}
              />
              {!isView && <InlineError msg={errors.days?.message ?? ""} />}
            </div>

            <div>
              <CustomLabel required>Tour Type</CustomLabel>
              {isView ? (
                <Input
                  value={
                    getTypeLabel(watch("type")) ||
                    getTypeLabel(initialData?.type) ||
                    ""
                  }
                  readOnly
                  disabled
                />
              ) : (
                <>
                  <input type="hidden" {...register("type")} />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {watch("type")
                          ? getTypeLabel(watch("type"))
                          : "Select a type"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search type..." />
                        <CommandEmpty>No type found.</CommandEmpty>
                        <div className="max-h-72 overflow-y-auto overscroll-contain">
                          <CommandGroup>
                            {[
                              { value: "private", label: "Private" },
                              { value: "group", label: "Group" },
                            ].map((opt) => (
                              <CommandItem
                                key={opt.value}
                                value={opt.label}
                                onSelect={() =>
                                  setValue("type", opt.value as any, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                    shouldTouch: true,
                                  })
                                }
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    watch("type") === opt.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {opt.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <InlineError msg={errors.type?.message ?? ""} />
                </>
              )}
            </div>

            {/* City */}
            <div>
              <CustomLabel required>City</CustomLabel>
              {isView ? (
                <Input
                  value={(() => {
                    const c = cities.find((x) => x.id === watch("cityId"));
                    if (c) {
                      return `${c.name_en}${
                        c.name_ru ? ` - ${c.name_ru}` : ""
                      }`;
                    }
                    return initialData?.cityId
                      ? String(initialData.cityId)
                      : "";
                  })()}
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
                      {(() => {
                        const c = cities.find((x) => x.id === watch("cityId"));
                        if (c) {
                          return `${c.name_en}${
                            c.name_ru ? ` - ${c.name_ru}` : ""
                          }`;
                        }
                        return citiesLoading ? "Loading..." : "Select a city";
                      })()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search city..." />
                      <CommandEmpty>No city found.</CommandEmpty>
                      <div className="max-h-72 overflow-y-auto overscroll-contain">
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
                                  city.id === watch("cityId")
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {city.name_en}
                              {city.name_ru ? ` - ${city.name_ru}` : ""}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {!isView && <InlineError msg={errors.cityId?.message ?? ""} />}
            </div>

            {/* Category */}
            <div>
              <CustomLabel required>Category</CustomLabel>
              {isView ? (
                <Input
                  value={
                    categoryLabel(
                      categories.find((c) => c.id === watch("categoryId"))
                    ) ||
                    (initialData?.categoryId
                      ? `#${initialData.categoryId}`
                      : "")
                  }
                  readOnly
                  disabled
                />
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      disabled={tourCatsQuery.isLoading}
                    >
                      {tourCatsQuery.isLoading
                        ? "Loading categories…"
                        : (() => {
                            const c = categories.find(
                              (x) => x.id === watch("categoryId")
                            );
                            return c ? categoryLabel(c) : "Select a category";
                          })()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search category…" />
                      <CommandEmpty>No category found.</CommandEmpty>
                      {/* Scroll container */}
                      <div className="max-h-72 overflow-y-auto overscroll-contain">
                        <CommandGroup>
                          {categories.map((c) => {
                            const lbl = categoryLabel(c);
                            const checked = c.id === watch("categoryId");
                            return (
                              <CommandItem
                                key={c.id}
                                value={lbl}
                                onSelect={() =>
                                  setValue("categoryId", c.id, {
                                    shouldValidate: true,
                                  })
                                }
                                className="flex items-center justify-between"
                              >
                                <div className="truncate">{lbl}</div>
                                <Check
                                  className={`h-4 w-4 ${
                                    checked ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {!isView && (
                <InlineError msg={errors.categoryId?.message ?? ""} />
              )}
            </div>

            <div className="md:col-span-2">
              <CustomLabel>YouTube Link</CustomLabel>
              <Input
                {...register("youtubeLink")}
                placeholder="https://youtube.com/watch?v=xxxxx"
                {...ro}
              />
              {!isView && (
                <InlineError msg={errors.youtubeLink?.message ?? ""} />
              )}
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <CustomLabel required>Thumbnail</CustomLabel>
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
            <CustomLabel>Tour Images</CustomLabel>
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

          {/* Infos */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <CustomLabel>Infos</CustomLabel>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => infosArray.append(emptyNameObj())}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add info
                </Button>
              )}
            </div>
            {infosArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Info #{index + 1}</p>
                  {!isView && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => infosArray.remove(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <div key={lang}>
                      <Input
                        placeholder={`Info ${lang.toUpperCase()}`}
                        {...register(`infos.${index}.name_${lang}` as const)}
                        {...ro}
                      />
                      {!isView && (
                        <InlineError
                          msg={
                            (errors.infos?.[index] as any)?.[`name_${lang}`]
                              ?.message
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Routes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <CustomLabel>Routes</CustomLabel>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => routesArray.append(emptyNameObj())}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add route
                </Button>
              )}
            </div>
            {routesArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Route #{index + 1}</p>
                  {!isView && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => routesArray.remove(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <div key={lang}>
                      <Input
                        placeholder={`Route ${lang.toUpperCase()}`}
                        {...register(`routes.${index}.name_${lang}` as const)}
                        {...ro}
                      />
                      {!isView && (
                        <InlineError
                          msg={
                            (errors.routes?.[index] as any)?.[`name_${lang}`]
                              ?.message
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Itinerary */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <CustomLabel required>Itinerary</CustomLabel>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    itineraryArray.append({
                      day: itineraryArray.fields.length + 1,
                      ...emptyActivityObj(),
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add day
                </Button>
              )}
            </div>
            {itineraryArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Day #{index + 1}</p>
                  {!isView && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => itineraryArray.remove(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Day"
                      {...register(`itinerary.${index}.day` as const, {
                        valueAsNumber: true,
                      })}
                      {...ro}
                    />
                    {!isView && (
                      <InlineError
                        msg={errors.itinerary?.[index]?.day?.message ?? ""}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {LANGS.map((lang) => (
                    <div key={lang}>
                      <Input
                        placeholder={`Activity ${lang.toUpperCase()}`}
                        {...register(
                          `itinerary.${index}.activity_${lang}` as const
                        )}
                        {...ro}
                      />
                      {!isView && (
                        <InlineError
                          msg={
                            (errors.itinerary?.[index] as any)?.[
                              `activity_${lang}`
                            ]?.message
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Price / Included / Not included */}
          <section className="space-y-3">
            <CustomLabel required>Price Amount</CustomLabel>
            <Input
              type="number"
              {...register("priceAmount", { valueAsNumber: true })}
              {...ro}
            />
            {!isView && <InlineError msg={errors.priceAmount?.message ?? ""} />}

            <div className="flex items-center justify-between mt-2">
              <CustomLabel>Included</CustomLabel>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => priceIncludedArray.append(emptyNameObj())}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add included
                </Button>
              )}
            </div>
            {priceIncludedArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Included #{index + 1}</p>
                  {!isView && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => priceIncludedArray.remove(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <div key={lang}>
                      <Input
                        placeholder={`Included ${lang.toUpperCase()}`}
                        {...register(
                          `priceIncluded.${index}.name_${lang}` as const
                        )}
                        {...ro}
                      />
                      {!isView && (
                        <InlineError
                          msg={
                            (errors.priceIncluded?.[index] as any)?.[
                              `name_${lang}`
                            ]?.message
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between mt-2">
              <CustomLabel>Not Included</CustomLabel>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => priceNotIncludedArray.append(emptyNameObj())}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add not-included
                </Button>
              )}
            </div>
            {priceNotIncludedArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">
                    Not Included #{index + 1}
                  </p>
                  {!isView && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => priceNotIncludedArray.remove(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <div key={lang}>
                      <Input
                        placeholder={`Not Included ${lang.toUpperCase()}`}
                        {...register(
                          `priceNotIncluded.${index}.name_${lang}` as const
                        )}
                        {...ro}
                      />
                      {!isView && (
                        <InlineError
                          msg={
                            (errors.priceNotIncluded?.[index] as any)?.[
                              `name_${lang}`
                            ]?.message
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <DialogFooter>
            {!isView && (
              <Button
                type="submit"
                disabled={!isDirty || loading || isLoading}
                variant="outline"
                className="min-w-[90px]"
                onClick={() => onOpenChange(false)}
              >
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
