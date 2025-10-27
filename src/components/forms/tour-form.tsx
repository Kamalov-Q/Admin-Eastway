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
import { useTours, type Tour } from "@/api/tours";
import { uploadImages, uploadThumbnail } from "@/api/upload";
import { X, Plus, Trash2, Check } from "lucide-react";

import { useCities } from "@/api/cities";
import { useTourCategories, type Category } from "@/api/tour-category";
import { type TourTariff } from "@/api/tour-tariff";

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

const LANGS = ["en", "ru", "gr", "jp", "es", "zh"] as const;
type Lang = (typeof LANGS)[number];

const emptyLangObject = () =>
  LANGS.reduce(
    (acc, lang) => ({ ...acc, [`name_${lang}`]: "" }),
    {} as Record<`name_${Lang}`, string>
  );

const schema = z.object({
  days: z.number().min(1, "Days is required"),
  type: z.enum(["private", "group"] as const, {
    message: "Tour type is required",
  }),
  cityId: z.number().min(1, "City is required"),
  tourCategoryId: z.number().min(1, "Category is required"),
  youtubeLink: z.string().url("Must be a valid YouTube URL"),
  thumbnailFile: z.any().optional(),
  infos: z
    .array(
      z.object(
        LANGS.reduce(
          (acc, lang) => ({
            ...acc,
            [`name_${lang}`]: z
              .string()
              .min(1, `${lang.toUpperCase()} info is required`),
          }),
          {} as Record<`name_${Lang}`, z.ZodString>
        )
      )
    )
    .min(1, "Add at least one info"),
  routes: z
    .array(
      z.object(
        LANGS.reduce(
          (acc, lang) => ({
            ...acc,
            [`name_${lang}`]: z
              .string()
              .min(1, `${lang.toUpperCase()} route is required`),
          }),
          {} as Record<`name_${Lang}`, z.ZodString>
        )
      )
    )
    .min(1, "Add at least one route"),
  itinerary: z
    .array(
      z.object({
        day: z.number().min(1, "Day must be ≥ 1"),
        activity: z.string().min(1, "Activity is required"),
      })
    )
    .min(1, "Add at least one itinerary entry"),
  priceAmount: z.number().min(1, "Price is required"),
  priceIncluded: z
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
    .min(1, "Add at least one included item"),
  priceNotIncluded: z
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
    .min(1, "Add at least one not-included item"),
  ...LANGS.reduce(
    (acc, lang) => ({
      ...acc,
      [`title_${lang}`]: z
        .string()
        .min(1, `Title (${lang.toUpperCase()}) is required`),
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

  const { data: cities = [], isLoading: citiesLoading } = useCities({
    limit: 100,
  });

  // categories
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

  const tariffsQuery = useTours({ limit: 1000 });
  const tariffs: TourTariff[] = React.useMemo(() => {
    const raw = tariffsQuery.data as any;
    return Array.isArray(raw) ? raw : raw?.data ?? [];
  }, [tariffsQuery.data]);

  const derivedInitialTariffIds = React.useMemo<number[]>(() => {
    const direct: number[] = (initialData as any)?.tariffIds ?? [];
    if (direct?.length) return direct;
    const fromRel =
      ((initialData as any)?.tariff as any[])?.map((x: any) => x.tariffId) ??
      [];
    return fromRel;
  }, [initialData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    setValue,
    watch,
  } = useForm<TourFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      days: initialData?.days ?? 1,
      type: (initialData?.type as any) ?? ("" as any),
      cityId: initialData?.cityId ?? 0,
      tourCategoryId: initialData?.tourCategoryId ?? 0,
      youtubeLink: initialData?.youtubeLink ?? "",
      infos: initialData?.infos?.length
        ? (initialData.infos as any)
        : [emptyLangObject()],
      routes: initialData?.routes?.length
        ? (initialData.routes as any)
        : [emptyLangObject()],
      itinerary: initialData?.itinerary?.length
        ? initialData.itinerary
        : [{ day: 1, activity: "" }],
      priceAmount: initialData?.price?.amount ?? 1,
      priceIncluded: initialData?.price?.included?.length
        ? (initialData.price.included as any)
        : [emptyLangObject()],
      priceNotIncluded: initialData?.price?.notIncluded?.length
        ? (initialData.price.notIncluded as any)
        : [emptyLangObject()],
      ...LANGS.reduce(
        (acc, lang) => ({
          ...acc,
          [`title_${lang}`]: (initialData as any)?.[`title_${lang}`] ?? "",
          [`desc_${lang}`]: (initialData as any)?.[`desc_${lang}`] ?? "",
          [`address_${lang}`]: (initialData as any)?.[`address_${lang}`] ?? "",
        }),
        {} as Record<string, string>
      ),
      // tariffIds: derivedInitialTariffIds,
    },
  });

  const TYPE_OPTIONS = [
    { value: "private", label: "Private" },
    { value: "group", label: "Group" },
  ];
  const getTypeLabel = (v?: string | null) =>
    TYPE_OPTIONS.find((o) => o.value === v)?.label ?? "";

  // inside your component (you already have setValue, watch, errors, register, isView, initialData)
  const selectedType = watch("type");

  React.useEffect(() => {
    if (!open) return;
    reset({
      days: initialData?.days ?? 1,
      type: (initialData?.type as any) ?? ("" as any),
      cityId: initialData?.cityId ?? 0,
      tourCategoryId: initialData?.tourCategoryId ?? 0,
      youtubeLink: initialData?.youtubeLink ?? "",
      infos: initialData?.infos?.length
        ? (initialData.infos as any)
        : [emptyLangObject()],
      routes: initialData?.routes?.length
        ? (initialData.routes as any)
        : [emptyLangObject()],
      itinerary: initialData?.itinerary?.length
        ? initialData.itinerary
        : [{ day: 1, activity: "" }],
      priceAmount: initialData?.price?.amount ?? 1,
      priceIncluded: initialData?.price?.included?.length
        ? (initialData.price.included as any)
        : [emptyLangObject()],
      priceNotIncluded: initialData?.price?.notIncluded?.length
        ? (initialData.price.notIncluded as any)
        : [emptyLangObject()],
      ...LANGS.reduce(
        (acc, lang) => ({
          ...acc,
          [`title_${lang}`]: (initialData as any)?.[`title_${lang}`] ?? "",
          [`desc_${lang}`]: (initialData as any)?.[`desc_${lang}`] ?? "",
          [`address_${lang}`]: (initialData as any)?.[`address_${lang}`] ?? "",
        }),
        {} as Record<string, string>
      ),
      // tariffIds: derivedInitialTariffIds,
    });
    setThumbnailPreview(initialData?.thumbnail ?? null);
    setExistingImageUrls(initialData?.images?.map((i) => i.url) ?? []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
  }, [open, initialData, reset, derivedInitialTariffIds]);

  const infosArray = useFieldArray({ control, name: "infos" });
  const routesArray = useFieldArray({ control, name: "routes" });
  const itineraryArray = useFieldArray({ control, name: "itinerary" });
  const priceIncludedArray = useFieldArray({ control, name: "priceIncluded" });
  const priceNotIncludedArray = useFieldArray({
    control,
    name: "priceNotIncluded",
  });

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

  const onSubmitHandler = async (values: TourFormValues) => {
    if (isView) {
      onOpenChange(false);
      return;
    }

    if (
      !thumbnailPreview &&
      (!values.thumbnailFile || values.thumbnailFile.length === 0)
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
      uploadedNewUrls = await uploadImages(newImageFiles, "tours");
    }

    const mergedImages = [
      ...existingImageUrls.map((url) => ({ url })),
      ...uploadedNewUrls.map((url) => ({ url })),
    ];

    const payload: Partial<Tour> = {
      days: values.days,
      type: values.type,
      cityId: values.cityId,
      tourCategoryId: values.tourCategoryId,
      thumbnail: thumbnailUrl ?? undefined,
      youtubeLink: values.youtubeLink,
      images: mergedImages,
      infos: values.infos,
      routes: values.routes,
      itinerary: values.itinerary,
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
      // NEW: attach tariffs if chosen
      // ...(values.tariffIds && values.tariffIds.length
      //   ? { tariffIds: values.tariffIds }
      //   : {}),
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

  const selectedCategoryId = watch("tourCategoryId");
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const ro = isView ? { readOnly: true, disabled: true } : {};

  // Tariff multi-select
  // const [openTariffs, setOpenTariffs] = React.useState(false);
  // const selectedTariffIds = watch("tariffIds") || [];
  // const selectedTariffs = React.useMemo(
  //   () =>
  //     selectedTariffIds
  //       .map((id) => tariffs.find((t) => t.id === id))
  //       .filter(Boolean) as TourTariff[],
  //   [selectedTariffIds, tariffs]
  // );

  // const toggleTariff = (id: number) => {
  //   if (isView) return;
  //   const exists = selectedTariffIds.includes(id);
  //   const next = exists
  //     ? selectedTariffIds.filter((x: number) => x !== id)
  //     : [...selectedTariffIds, id];
  //   setValue("tariffIds", next, { shouldValidate: false });
  // };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {isView ? "View Tour" : initialData ? "Edit Tour" : "Add Tour"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
          {/* Titles / Desc / Address across languages */}
          <div className="space-y-4">
            {LANGS.map((lang) => (
              <div key={lang} className="border rounded-lg p-3 space-y-2">
                <label className="font-semibold">
                  Title ({lang.toUpperCase()})
                </label>
                <Input {...register(`title_${lang}` as const)} {...ro} />
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

          {/* Basics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Days</Label>
              <Input
                type="number"
                {...register("days", { valueAsNumber: true })}
                {...ro}
              />
              {!isView && <InlineError msg={errors.days?.message} />}
            </div>

            <div>
              <Label required>Tour Type</Label>

              {isView ? (
                <Input
                  value={
                    getTypeLabel(selectedType) ||
                    getTypeLabel(initialData?.type) ||
                    ""
                  }
                  readOnly
                  disabled
                />
              ) : (
                <>
                  {/* keep RHF field registered */}
                  <input type="hidden" {...register("type")} />

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedType
                          ? getTypeLabel(selectedType)
                          : "Select type"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search type..." />
                        <CommandEmpty>No type found.</CommandEmpty>
                        <CommandGroup>
                          {TYPE_OPTIONS.map((opt) => (
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
                                  selectedType === opt.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {opt.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <InlineError msg={errors.type?.message} />
                </>
              )}
            </div>

            {/* City combobox */}
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
              {!isView && <InlineError msg={errors.cityId?.message} />}
            </div>

            {/* Category combobox */}
            <div>
              <Label required>Category</Label>
              {isView ? (
                <Input
                  value={
                    categoryLabel(selectedCategory) ||
                    (initialData?.tourCategoryId
                      ? `#${initialData.tourCategoryId}`
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
                        : selectedCategory
                        ? categoryLabel(selectedCategory)
                        : "Select a category"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search category…" />
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {categories.map((c) => {
                          const lbl = categoryLabel(c);
                          const checked = c.id === selectedCategoryId;
                          return (
                            <CommandItem
                              key={c.id}
                              value={lbl}
                              onSelect={() =>
                                setValue("tourCategoryId", c.id, {
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
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {!isView && <InlineError msg={errors.tourCategoryId?.message} />}
            </div>

            <div className="md:col-span-2">
              <Label required>YouTube Link</Label>
              <Input
                {...register("youtubeLink")}
                placeholder="https://youtube.com/watch?v=xxxxx"
                {...ro}
              />
              {!isView && <InlineError msg={errors.youtubeLink?.message} />}
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
            <Label required>Tour Images</Label>
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
              <Label required>Infos</Label>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => infosArray.append(emptyLangObject())}
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
            {!isView && (
              <InlineError msg={errors.infos?.message as string | undefined} />
            )}
          </section>

          {/* Routes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label required>Routes</Label>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => routesArray.append(emptyLangObject())}
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
            {!isView && (
              <InlineError msg={errors.routes?.message as string | undefined} />
            )}
          </section>

          {/* Itinerary */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label required>Itinerary</Label>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    itineraryArray.append({ day: 1, activity: "" })
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
                        msg={errors.itinerary?.[index]?.day?.message}
                      />
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Activity"
                      {...register(`itinerary.${index}.activity` as const)}
                      {...ro}
                    />
                    {!isView && (
                      <InlineError
                        msg={errors.itinerary?.[index]?.activity?.message}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!isView && (
              <InlineError
                msg={errors.itinerary?.message as string | undefined}
              />
            )}
          </section>

          {/* Price / Included / Not included */}
          <section className="space-y-3">
            <Label required>Price Amount</Label>
            <Input
              type="number"
              {...register("priceAmount", { valueAsNumber: true })}
              {...ro}
            />
            {!isView && <InlineError msg={errors.priceAmount?.message} />}

            <div className="flex items-center justify-between mt-2">
              <Label required>Included</Label>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => priceIncludedArray.append(emptyLangObject())}
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
            {!isView && (
              <InlineError
                msg={errors.priceIncluded?.message as string | undefined}
              />
            )}

            <div className="flex items-center justify-between mt-2">
              <Label required>Not Included</Label>
              {!isView && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    priceNotIncludedArray.append(emptyLangObject())
                  }
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
            {!isView && (
              <InlineError
                msg={errors.priceNotIncluded?.message as string | undefined}
              />
            )}
          </section>

          {/* Tariffs multi-select (attach existing tariffs to this tour) */}
          {/* <section className="space-y-2">
            <Label>Attach Tariffs</Label>
            <Popover open={openTariffs} onOpenChange={setOpenTariffs}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  disabled={isView || tariffsQuery.isLoading}
                >
                  {tariffsQuery.isLoading
                    ? "Loading tariffs…"
                    : selectedTariffs.length
                    ? `${selectedTariffs.length} selected`
                    : "Select tariff(s)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] p-0 max-h-[60vh] overflow-y-auto">
                <Command>
                  <CommandInput placeholder="Search tariffs…" />
                  <CommandEmpty>No tariffs found.</CommandEmpty>
                  <CommandGroup>
                    {tariffs.map((t) => {
                      const checked = selectedTariffIds.includes(t.id);
                      const label = t.name || `#${t.id}`;
                      return (
                        <CommandItem
                          key={t.id}
                          value={label}
                          onSelect={() => toggleTariff(t.id)}
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

            <div className="flex flex-wrap gap-2 mt-1">
              {selectedTariffs.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs"
                >
                  {t.name || `#${t.id}`}
                  {!isView && (
                    <button
                      type="button"
                      className="ml-1 hover:opacity-70"
                      onClick={() => toggleTariff(t.id)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </section> */}

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
