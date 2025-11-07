"use client";

import * as React from "react";
import type { Hotel } from "@/api/hotels";
import {
  useHotels,
  useCreateHotel,
  useUpdateHotel,
  useDeleteHotel,
  type HotelsQuery,
} from "@/api/hotels";
import { useCountries, type Country } from "@/api/countries";
import { useCities, type City } from "@/api/cities";
import { useHotelCategories } from "@/api/hotel-category";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HotelsTable } from "@/components/tables/hotels-table";
import { HotelFormModal } from "@/components/forms/hotel-form";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import toast from "react-hot-toast";

const ALL = "__ALL__";

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function localized<T extends Record<string, any>>(
  obj: T | null | undefined,
  keys: string[]
): string | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export default function HotelsPage() {
  // filters
  const [country, setCountry] = React.useState<string>("");
  const [city, setCity] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("");

  // table pagination
  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(10);

  // dropdown pagination (cities from API)
  const [cityPage, setCityPage] = React.useState<number>(1);
  const [cityPageSize] = React.useState<number>(20);

  // dropdown pagination (categories — client chunking)
  const [catPage, setCatPage] = React.useState<number>(1);
  const catPageSize = 20;

  const dCountry = useDebounced(country);
  const dCity = useDebounced(city);
  const dName = useDebounced(name);
  const dCategory = useDebounced(category);

  // -------- Countries ----------
  const countriesQuery = useCountries();
  const countriesRaw = countriesQuery.data as any;
  const countries: Country[] = Array.isArray(countriesRaw)
    ? countriesRaw
    : countriesRaw?.data ?? [];

  // -------- Cities (server-paginated & filtered by selected country) ----------
  const citiesQuery = useCities({
    country: dCountry || undefined,
    page: cityPage,
    limit: cityPageSize,
  });
  const citiesResp: any = citiesQuery.data;
  const cities: City[] = Array.isArray(citiesResp)
    ? (citiesResp as City[])
    : citiesResp?.data ?? [];
  const citiesTotal: number =
    typeof citiesResp?.total === "number"
      ? citiesResp.total
      : citiesResp?.data?.length ?? 0;
  const citiesTotalPages =
    typeof citiesResp?.totalPages === "number"
      ? citiesResp.totalPages
      : Math.max(1, Math.ceil(citiesTotal / (cityPageSize || 1)));

  // -------- Categories (not server-paginated -> chunk client-side) ----------
  const {
    data: categoriesRaw,
    isLoading: categoryLoading,
    isError: categoryError,
  } = useHotelCategories();

  const categoriesAll: any[] = React.useMemo(() => {
    if (!categoriesRaw) return [];
    return Array.isArray(categoriesRaw)
      ? categoriesRaw
      : (categoriesRaw as any).data ?? [];
  }, [categoriesRaw]);

  const sortedCategories = React.useMemo(
    () =>
      categoriesAll
        .slice()
        .sort((a, b) =>
          (
            localized(a, ["name_en", "name_ru", "name_es"]) ?? String(a?.id)
          ).localeCompare(
            localized(b, ["name_en", "name_ru", "name_es"]) ?? String(b?.id),
            undefined,
            { sensitivity: "base" }
          )
        ),
    [categoriesAll]
  );

  const catTotal = sortedCategories.length;
  const catTotalPages = Math.max(1, Math.ceil(catTotal / catPageSize));
  const catSliceStart = (catPage - 1) * catPageSize;
  const catSliceEnd = catSliceStart + catPageSize;
  const categories = sortedCategories.slice(catSliceStart, catSliceEnd);

  // Reset dropdown pages when country filter changes
  React.useEffect(() => {
    setCityPage(1);
  }, [dCountry]);

  // -------- Hotels page data ----------
  const params = React.useMemo<HotelsQuery>(
    () => ({
      country: dCountry || undefined,
      city: dCity || undefined,
      name: dName || undefined,
      category: dCategory || undefined,
      page,
      limit,
    }),
    [dCountry, dCity, dName, dCategory, page, limit]
  );

  const {
    data: pageData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useHotels(params);

  React.useEffect(() => setPage(1), [dCountry, dCity, dName, dCategory]);

  const errorNotifiedRef = React.useRef(false);
  React.useEffect(() => {
    if (isError && !errorNotifiedRef.current) {
      toast.error((error as any)?.message ?? "Failed to load hotels.");
      errorNotifiedRef.current = true;
    }
    if (!isError) errorNotifiedRef.current = false;
  }, [isError, error]);

  const createHotel = useCreateHotel();
  const updateHotel = useUpdateHotel();
  const deleteHotel = useDeleteHotel();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingHotel, setEditingHotel] = React.useState<Hotel | null>(null);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewHotel, setViewHotel] = React.useState<Hotel | null>(null);

  const openAdd = () => {
    setEditingHotel(null);
    setFormOpen(true);
  };
  const openEdit = (h: Hotel) => {
    setEditingHotel(h);
    setFormOpen(true);
  };
  const openView = (h: Hotel) => {
    setViewHotel(h);
    setViewOpen(true);
  };

  const handleSubmit = async (values: Partial<Hotel>) => {
    if (editingHotel) {
      await toast.promise(
        updateHotel.mutateAsync({ id: editingHotel.id, payload: values }),
        {
          loading: "Updating hotel…",
          success: `Hotel updated${
            values.name_en ? ` (${values.name_en})` : ""
          }`,
          error: (e) => (e as any)?.message || "Failed to update hotel",
        }
      );
    } else {
      await toast.promise(createHotel.mutateAsync(values), {
        loading: "Creating hotel…",
        success: `Hotel created${values.name_en ? ` (${values.name_en})` : ""}`,
        error: (e) => (e as any)?.message || "Failed to create hotel",
      });
    }
    setFormOpen(false);
  };

  // ---------- Table pagination & range ----------
  const hotels = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = pageData?.totalPages ?? 1;
  const currentPage = pageData?.page ?? page;

  const canPrev = pageData
    ? !!(pageData as any).hasPrevPage || currentPage > 1
    : currentPage > 1;
  const canNext = pageData
    ? !!(pageData as any).hasNextPage || currentPage < totalPages
    : currentPage < totalPages;

  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(total, currentPage * limit);

  // Prevent Select from closing when pressing dropdown pagination buttons
  const keepOpenMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const countryLabel = (c: Country) =>
    localized(c, ["name_en", "name_ru", "name_es"]) ?? String((c as any).id);
  const cityLabel = (ct: City) =>
    localized(ct, ["name_en", "name_ru", "name_es"]) ?? String((ct as any).id);
  const categoryLabel = (cat: any) =>
    localized(cat, ["name_en", "name_ru", "name_es"]) ??
    String((cat as any).id);

  const onDelete = async (id: number) => {
    await deleteHotel.mutateAsync(id);
    const remaining = (hotels?.length ?? 1) - 1;
    if (remaining <= 0 && currentPage > 1) {
      setPage((p) => Math.max(1, p - 1));
    }
  };

  if (!pageData && isLoading) return <div className="p-6">Loading…</div>;
  if (isError)
    return (
      <div className="p-6 text-red-600">Error: {(error as any)?.message}</div>
    );

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Hotels Management</h1>
        <Button onClick={openAdd}>+ Add Hotel</Button>
      </div>

      {/* Toolbar (with page indicator like Tours) */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-7 gap-3">
        {/* Country */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Country</label>
          <Select
            value={country || undefined}
            onValueChange={(v) => {
              if (v === ALL) {
                setCountry("");
                setCity("");
                setCityPage(1);
              } else {
                setCountry(v);
                setCity("");
                setCityPage(1);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto hover:overflow-y-auto">
              <SelectItem value={ALL}>All countries</SelectItem>
              {countries
                .slice()
                .sort((a, b) =>
                  countryLabel(a).localeCompare(countryLabel(b), undefined, {
                    sensitivity: "base",
                  })
                )
                .map((c) => {
                  const label = countryLabel(c);
                  return (
                    <SelectItem key={(c as any).id ?? label} value={label}>
                      {label}
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>

        {/* City (server-paginated + scroll) */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">City</label>
          <Select
            value={city || undefined}
            onValueChange={(v) => setCity(v === ALL ? "" : v)}
            disabled={citiesQuery.isLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  citiesQuery.isLoading ? "Loading..." : "All cities"
                }
              />
            </SelectTrigger>

            <SelectContent className="max-h-64 overflow-y-auto hover:overflow-y-auto">
              <SelectItem value={ALL}>All cities</SelectItem>

              {cities
                .slice()
                .sort((a, b) =>
                  cityLabel(a).localeCompare(cityLabel(b), undefined, {
                    sensitivity: "base",
                  })
                )
                .map((ct) => {
                  const label = cityLabel(ct);
                  return (
                    <SelectItem key={ct.id} value={label}>
                      {label}
                    </SelectItem>
                  );
                })}

              {/* sticky footer for pagination */}
              <div
                className="sticky bottom-0 mt-1 bg-white border-t flex items-center justify-between px-2 py-1"
                onMouseDown={keepOpenMouseDown}
              >
                <span className="text-xs text-gray-600">
                  {cityPage}/{citiesTotalPages || 1}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCityPage((p) => Math.max(1, p - 1))}
                    disabled={citiesQuery.isLoading || cityPage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setCityPage((p) => Math.min(citiesTotalPages || 1, p + 1))
                    }
                    disabled={
                      citiesQuery.isLoading ||
                      (citiesTotalPages ? cityPage >= citiesTotalPages : true)
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Name</label>
          <Input
            placeholder="Search by name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Category (client-chunked + scroll) */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Category</label>
          <Select
            value={category || undefined}
            onValueChange={(v) => setCategory(v === ALL ? "" : v)}
            disabled={categoryLoading || categoryError}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  categoryLoading ? "Loading categories…" : "All categories"
                }
              />
            </SelectTrigger>

            <SelectContent className="max-h-64 overflow-y-auto hover:overflow-y-auto">
              <SelectItem value={ALL}>All categories</SelectItem>

              {!categoryLoading &&
                !categoryError &&
                categories.map((cat) => {
                  const label = categoryLabel(cat);
                  return (
                    <SelectItem key={(cat as any).id ?? label} value={label}>
                      {label}
                    </SelectItem>
                  );
                })}

              {/* sticky footer for client-side pagination */}
              <div
                className="sticky bottom-0 mt-1 bg-white border-t flex items-center justify-between px-2 py-1"
                onMouseDown={keepOpenMouseDown}
              >
                <span className="text-xs text-gray-600">
                  {catPage}/{catTotalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCatPage((p) => Math.max(1, p - 1))}
                    disabled={catPage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setCatPage((p) => Math.min(catTotalPages, p + 1))
                    }
                    disabled={catPage >= catTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Rows</label>
          <select
            className="border rounded-md py-2 px-2 text-sm"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Page display (like Tours) */}
        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </div>
        </div>
      </div>

      {/* Table + overlay */}
      <div className="relative rounded-xl border bg-white p-2">
        {isFetching && hotels.length > 0 && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </div>
          </div>
        )}

        <HotelsTable
          data={hotels}
          onEdit={openEdit}
          onView={openView}
          onDelete={onDelete}
          isLoadingData={isFetching || isLoading}
          isErrorData={isError}
          errorMessage={(error as any)?.message}
        />
      </div>

      {/* Footer: range + pagination (match Tours) */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {total > 0 ? (
            <>
              Showing <span className="font-medium">{startIndex}</span>–
              <span className="font-medium">{endIndex}</span> of{" "}
              <span className="font-medium">{total}</span>
            </>
          ) : (
            <>No hotels found</>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!canPrev || isFetching}
            onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!canNext || isFetching}
            onClick={() => canNext && setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create/Edit */}
      <HotelFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editingHotel}
        onSubmit={handleSubmit}
        mode={editingHotel ? "edit" : "create"}
      />

      {/* View */}
      <HotelFormModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        initialData={viewHotel}
        onSubmit={() => {}}
        mode="view"
      />
    </div>
  );
}
