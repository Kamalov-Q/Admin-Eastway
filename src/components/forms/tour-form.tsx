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
import type { Tour } from "@/api/tours";
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

/* ----------------------------- Constants ----------------------------- */

const LANGS = ["en", "ru", "gr", "jp", "es", "zh"] as const;
type Lang = (typeof LANGS)[number];

const emptyLangObject = () =>
  LANGS.reduce(
    (acc, lang) => ({ ...acc, [`name_${lang}`]: "" }),
    {} as Record<`name_${Lang}`, string>
  );

/* ----------------------------- Validation ---------------------------- */

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
    }),
    {} as Record<`title_${Lang}` | `desc_${Lang}`, any>
  ),
});

export type TourFormValues = z.infer<typeof schema>;

/* ------------------------------ Component ---------------------------- */

type Props = {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  initialData?: Tour | null;
  onSubmit: (values: Partial<Tour>) => Promise<void> | void;
};

export function TourFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: Props) {
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
  } = useForm<TourFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      days: 1,
      type: "" as any, // RHF needs something; Zod will enforce valid choice
      cityId: 0,
      tourCategoryId: 0,
      youtubeLink: "",
      infos: [emptyLangObject()],
      routes: [emptyLangObject()],
      itinerary: [{ day: 1, activity: "" }],
      priceAmount: 1,
      priceIncluded: [emptyLangObject()],
      priceNotIncluded: [emptyLangObject()],
      ...LANGS.reduce(
        (acc, lang) => ({
          ...acc,
          [`title_${lang}`]: "",
          [`desc_${lang}`]: "",
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

  /* --------------------------- Prefill for edit --------------------------- */
  React.useEffect(() => {
    if (!open) return;
    if (initialData) {
      reset({
        days: initialData.days ?? 1,
        type: (initialData.type as any) ?? ("" as any),
        cityId: initialData.cityId ?? 0,
        tourCategoryId: initialData.tourCategoryId ?? 0,
        youtubeLink: initialData.youtubeLink ?? "",
        infos: initialData.infos?.length
          ? (initialData.infos as any)
          : [emptyLangObject()],
        routes: initialData.routes?.length
          ? (initialData.routes as any)
          : [emptyLangObject()],
        itinerary: initialData.itinerary?.length
          ? initialData.itinerary
          : [{ day: 1, activity: "" }],
        priceAmount: initialData.price?.amount ?? 1,
        priceIncluded: initialData.price?.included?.length
          ? (initialData.price.included as any)
          : [emptyLangObject()],
        priceNotIncluded: initialData.price?.notIncluded?.length
          ? (initialData.price.notIncluded as any)
          : [emptyLangObject()],
        ...LANGS.reduce(
          (acc, lang) => ({
            ...acc,
            [`title_${lang}`]: (initialData as any)[`title_${lang}`] ?? "",
            [`desc_${lang}`]: (initialData as any)[`desc_${lang}`] ?? "",
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

  /* ------------------------------ Handlers ------------------------------ */

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
      setValue("thumbnailFile", e.target.files as any);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setNewImageFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setNewImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeExistingImage = (url: string) => {
    setExistingImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const removeNewImage = (index: number) => {
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ------------------------------- Submit ------------------------------- */

  const onSubmitHandler = async (values: TourFormValues) => {
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
        }),
        {}
      ),
    };

    await onSubmit(payload);
    onOpenChange(false);
  };

  /* ------------------------------ UI Helpers --------------------------- */

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

  /* -------------------------------- Render ----------------------------- */

  const selectedCityId = watch("cityId");
  const selectedCity = cities.find((c) => c.id === selectedCityId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Tour" : "Add Tour"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
          {/* ====== Titles & Descriptions ====== */}
          <div className="space-y-4">
            {LANGS.map((lang) => (
              <div key={lang} className="border rounded-lg p-3 space-y-2">
                <Label required>Title ({lang.toUpperCase()})</Label>
                <Input {...register(`title_${lang}` as const)} />
                <InlineError msg={(errors as any)[`title_${lang}`]?.message} />

                <Label>Description ({lang.toUpperCase()})</Label>
                <Input {...register(`desc_${lang}` as const)} />
              </div>
            ))}
          </div>

          {/* ====== Basic fields ====== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Days</Label>
              <Input
                type="number"
                {...register("days", { valueAsNumber: true })}
              />
              <InlineError msg={errors.days?.message} />
            </div>

            <div>
              <Label required>Tour Type</Label>
              <select
                {...register("type")}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                defaultValue={initialData?.type || ""}
              >
                <option value="" disabled>
                  Select type
                </option>
                <option value="private">Private</option>
                <option value="group">Group</option>
              </select>
              <InlineError msg={errors.type?.message} />
            </div>

            {/* ✅ Searchable city combobox (name_en - name_ru) */}
            <div>
              <Label required>City</Label>
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
              <InlineError msg={errors.cityId?.message} />
            </div>

            <div>
              <Label required>Category ID</Label>
              <Input
                type="number"
                {...register("tourCategoryId", { valueAsNumber: true })}
              />
              <InlineError msg={errors.tourCategoryId?.message} />
            </div>

            <div className="md:col-span-2">
              <Label required>YouTube Link</Label>
              <Input
                {...register("youtubeLink")}
                placeholder="https://youtube.com/watch?v=xxxxx"
              />
              <InlineError msg={errors.youtubeLink?.message} />
            </div>
          </div>

          {/* ====== Thumbnail ====== */}
          <div>
            <Label required>Thumbnail</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            {thumbnailPreview && (
              <img
                src={thumbnailPreview}
                alt="thumbnail"
                className="w-48 h-32 mt-2 object-cover rounded"
              />
            )}
          </div>

          {/* ====== Images (existing + new) ====== */}
          <div>
            <Label required>Tour Images</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
            />
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {existingImageUrls.map((url) => (
                <div key={url} className="relative group">
                  <img src={url} className="w-full h-32 object-cover rounded" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-90"
                    title="Remove"
                    onClick={() => removeExistingImage(url)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {newImagePreviews.map((src, idx) => (
                <div key={`new-${idx}`} className="relative group">
                  <img src={src} className="w-full h-32 object-cover rounded" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-90"
                    title="Remove"
                    onClick={() => removeNewImage(idx)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ====== Infos ====== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label required>Infos</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => infosArray.append(emptyLangObject())}
              >
                <Plus className="w-4 h-4 mr-1" /> Add info
              </Button>
            </div>
            {infosArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Info #{index + 1}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => infosArray.remove(index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <div key={lang}>
                      <Input
                        placeholder={`Info ${lang.toUpperCase()}`}
                        {...register(`infos.${index}.name_${lang}` as const)}
                      />
                      <InlineError
                        msg={
                          (errors.infos?.[index] as any)?.[`name_${lang}`]
                            ?.message
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <InlineError msg={errors.infos?.message as string | undefined} />
          </section>

          {/* ====== Routes ====== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label required>Routes</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => routesArray.append(emptyLangObject())}
              >
                <Plus className="w-4 h-4 mr-1" /> Add route
              </Button>
            </div>
            {routesArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Route #{index + 1}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => routesArray.remove(index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <div key={lang}>
                      <Input
                        placeholder={`Route ${lang.toUpperCase()}`}
                        {...register(`routes.${index}.name_${lang}` as const)}
                      />
                      <InlineError
                        msg={
                          (errors.routes?.[index] as any)?.[`name_${lang}`]
                            ?.message
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <InlineError msg={errors.routes?.message as string | undefined} />
          </section>

          {/* ====== Itinerary ====== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label required>Itinerary</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => itineraryArray.append({ day: 1, activity: "" })}
              >
                <Plus className="w-4 h-4 mr-1" /> Add day
              </Button>
            </div>
            {itineraryArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Day #{index + 1}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => itineraryArray.remove(index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Day"
                      {...register(`itinerary.${index}.day` as const, {
                        valueAsNumber: true,
                      })}
                    />
                    <InlineError
                      msg={errors.itinerary?.[index]?.day?.message}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Activity"
                      {...register(`itinerary.${index}.activity` as const)}
                    />
                    <InlineError
                      msg={errors.itinerary?.[index]?.activity?.message}
                    />
                  </div>
                </div>
              </div>
            ))}
            <InlineError
              msg={errors.itinerary?.message as string | undefined}
            />
          </section>

          {/* ====== Price Included / Not Included ====== */}
          <section className="space-y-3">
            <Label required>Price Amount</Label>
            <Input
              type="number"
              {...register("priceAmount", { valueAsNumber: true })}
            />
            <InlineError msg={errors.priceAmount?.message} />

            <div className="flex items-center justify-between mt-2">
              <Label required>Included</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => priceIncludedArray.append(emptyLangObject())}
              >
                <Plus className="w-4 h-4 mr-1" /> Add included
              </Button>
            </div>
            {priceIncludedArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Included #{index + 1}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => priceIncludedArray.remove(index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <div key={lang}>
                      <Input
                        placeholder={`Included ${lang.toUpperCase()}`}
                        {...register(
                          `priceIncluded.${index}.name_${lang}` as const
                        )}
                      />
                      <InlineError
                        msg={
                          (errors.priceIncluded?.[index] as any)?.[
                            `name_${lang}`
                          ]?.message
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <InlineError
              msg={errors.priceIncluded?.message as string | undefined}
            />

            <div className="flex items-center justify-between mt-2">
              <Label required>Not Included</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => priceNotIncludedArray.append(emptyLangObject())}
              >
                <Plus className="w-4 h-4 mr-1" /> Add not-included
              </Button>
            </div>
            {priceNotIncludedArray.fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">
                    Not Included #{index + 1}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => priceNotIncludedArray.remove(index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {LANGS.map((lang) => (
                    <div key={lang}>
                      <Input
                        placeholder={`Not Included ${lang.toUpperCase()}`}
                        {...register(
                          `priceNotIncluded.${index}.name_${lang}` as const
                        )}
                      />
                      <InlineError
                        msg={
                          (errors.priceNotIncluded?.[index] as any)?.[
                            `name_${lang}`
                          ]?.message
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <InlineError
              msg={errors.priceNotIncluded?.message as string | undefined}
            />
          </section>

          <DialogFooter>
            <Button type="submit">{initialData ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
