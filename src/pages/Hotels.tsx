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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HotelsTable } from "@/tables/hotels-table";
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

export default function HotelsPage() {
  const [country, setCountry] = React.useState<string>("");
  const [city, setCity] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(10);

  const dCountry = useDebounced(country);
  const dCity = useDebounced(city);
  const dName = useDebounced(name);
  const dCategory = useDebounced(category);

  const countriesQuery = useCountries();
  const countriesRaw = countriesQuery.data as any;
  const countries: Country[] = Array.isArray(countriesRaw)
    ? countriesRaw
    : countriesRaw?.data ?? [];

  const citiesQuery = useCities({
    country: dCountry || undefined,
    limit: 1000,
  });
  const cities: City[] = citiesQuery.data ?? [];

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

  // one-time toast for query error
  const errorNotifiedRef = React.useRef(false);
  React.useEffect(() => {
    if (isError && !errorNotifiedRef.current) {
      toast.error((error as any)?.message ?? "Failed to load hotels.");
      errorNotifiedRef.current = true;
    }
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

  if (!pageData && isLoading) return <div className="p-6">Loading…</div>;
  if (isError)
    return (
      <div className="p-6 text-red-600">Error: {(error as any)?.message}</div>
    );

  const hotels = pageData?.data ?? [];
  const totalPages = pageData?.totalPages ?? undefined;
  const currentPage = pageData?.page ?? page;
  const canPrev = currentPage > 1;
  const canNext = totalPages ? currentPage < totalPages : true;

  const countryLabel = (c: Country) =>
    (c as any).name_en ||
    (c as any).name_ru ||
    (c as any).name_es ||
    String(c.id);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Hotels Management</h1>
        <Button onClick={openAdd}>+ Add Hotel</Button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        {/* Country */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Country</label>
          <Select
            value={country || undefined}
            onValueChange={(v) => {
              if (v === ALL) {
                setCountry("");
                setCity("");
              } else {
                setCountry(v);
                setCity("");
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All countries</SelectItem>
              {countries.map((c) => {
                const label = countryLabel(c);
                return (
                  <SelectItem key={c.id} value={label}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
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
            <SelectContent>
              <SelectItem value={ALL}>All cities</SelectItem>
              {(cities ?? []).map((ct) => (
                <SelectItem key={ct.id} value={ct.name_en}>
                  {ct.name_en}
                </SelectItem>
              ))}
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

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Category</label>
          <Input
            placeholder="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
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

        {/* Page display */}
        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{currentPage}</span>
            {totalPages ? (
              <>
                {" "}
                of <span className="font-medium">{totalPages}</span>
              </>
            ) : null}
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
          onDelete={(id) => deleteHotel.mutateAsync(id).then(() => {})}
          isLoadingData={isFetching || isLoading}
          isErrorData={isError}
          errorMessage={(error as any)?.message}
        />
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          disabled={!canPrev}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!canNext}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
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
