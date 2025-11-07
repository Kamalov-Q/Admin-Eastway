import * as React from "react";
import type { Tour } from "@/api/tours";
import {
  useTours,
  useCreateTour,
  useUpdateTour,
  useDeleteTour,
  type ToursQuery,
} from "@/api/tours";
import { useCountries, type Country } from "@/api/countries";
import { useCities, type City } from "@/api/cities";
import { useTourCategories, type Category } from "@/api/tour-category";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToursTable } from "@/components/tables/tours-table";
import { TourFormModal } from "@/components/forms/tour-form";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ALL = "__ALL__";

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function ToursPage() {
  const [country, setCountry] = React.useState<string>("");
  const [city, setCity] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(10);
  const [type, setType] = React.useState<string>("");

  const dCountry = useDebounced(country);
  const dCity = useDebounced(city);
  const dName = useDebounced(name);
  const dCategory = useDebounced(category);
  const dType = useDebounced(type);

  // Countries
  const countriesQuery = useCountries({ page: 1, limit: 20 });
  const countriesRaw = countriesQuery.data as any;
  const countries: Country[] = Array.isArray(countriesRaw)
    ? countriesRaw
    : countriesRaw?.data ?? [];

  const citiesQuery = useCities({
    country: dCountry || undefined,
    limit: 20,
    page: 1,
  });
  const cities: City[] = citiesQuery.data?.data ?? [];

  // Categories
  const tourCatsQuery = useTourCategories();
  const catsRaw = tourCatsQuery.data as any;
  const tourCategories: Category[] = Array.isArray(catsRaw)
    ? catsRaw
    : catsRaw?.data ?? [];

  const params = React.useMemo<ToursQuery>(
    () => ({
      country: dCountry || undefined,
      city: dCity || undefined,
      name: dName || undefined,
      type: dType === "private" || dType === "group" ? dType : undefined,
      category: dCategory || undefined,
      page,
      limit,
    }),
    [dCountry, dCity, dName, dCategory, dType, page, limit]
  );

  const {
    data: pageData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useTours(params);

  React.useEffect(() => setPage(1), [dCountry, dCity, dType, dName, dCategory]);

  const createTour = useCreateTour();
  const updateTour = useUpdateTour();
  const deleteTour = useDeleteTour();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTour, setEditingTour] = React.useState<Tour | null>(null);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewTour, setViewTour] = React.useState<Tour | null>(null);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [tourToDelete, setTourToDelete] = React.useState<Tour | null>(null);

  const openAdd = () => {
    setEditingTour(null);
    setFormOpen(true);
  };
  const openEdit = (t: Tour) => {
    setEditingTour(t);
    setFormOpen(true);
  };
  const openView = (t: Tour) => {
    setViewTour(t);
    setViewOpen(true);
  };

  const requestDelete = (id: number) => {
    const t = pageData?.data?.find((x) => x.id === id) ?? null;
    setTourToDelete(t);
    setDeleteOpen(true);
  };
  const confirmDelete = () => {
    if (!tourToDelete) return;
    deleteTour.mutate(tourToDelete.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setTourToDelete(null);
      },
    });
  };

  const handleSubmit = async (values: Partial<Tour>) => {
    if (editingTour) {
      await updateTour.mutateAsync({ id: editingTour.id, payload: values });
    } else {
      await createTour.mutateAsync(values);
    }
    setFormOpen(false);
  };

  if (!pageData && isLoading) return <div className="p-6">Loading…</div>;
  if (isError)
    return (
      <div className="p-6 text-red-600">Error: {(error as any)?.message}</div>
    );

  const tours = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = pageData?.totalPages ?? 1;
  const currentPage = pageData?.page ?? page;

  const canPrev = pageData ? !!pageData.hasPrevPage : currentPage > 1;
  const canNext = pageData ? !!pageData.hasNextPage : currentPage < totalPages;

  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(total, currentPage * limit);

  const countryLabel = (c: Country) =>
    (c as any).name_en ||
    (c as any).name_ru ||
    (c as any).name_es ||
    String((c as any).id);

  const catLabel = (c: Category) =>
    c.name_en ||
    c.name_ru ||
    c.name_es ||
    c.name_gr ||
    c.name_jp ||
    c.name_zh ||
    `#${c.id}`;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Tours Management</h1>
        <Button onClick={openAdd}>+ Add Tour</Button>
      </div>

      {/* Toolbar */}
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
                  <SelectItem key={(c as any).id ?? label} value={label}>
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
              {cities.map((ct) => (
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
          <Select
            value={category || undefined}
            onValueChange={(v) => setCategory(v === ALL ? "" : v)}
            disabled={tourCatsQuery.isLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  tourCatsQuery.isLoading ? "Loading..." : "All categories"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {tourCategories.map((tc) => (
                <SelectItem key={tc.id} value={catLabel(tc)}>
                  {catLabel(tc)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Type</label>
          <Select
            value={type || undefined}
            onValueChange={(v) => setType(v === ALL ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="group">Group</SelectItem>
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

        {/* Page display */}
        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </div>
        </div>
      </div>

      {/* Table + overlay */}
      <div className="relative rounded-xl border bg-white p-2">
        {isFetching && tours.length > 0 && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </div>
          </div>
        )}

        <ToursTable
          data={tours}
          onEdit={openEdit}
          onDelete={(id) => requestDelete(id)}
          onView={openView}
        />
      </div>

      {/* Footer: range + pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {total > 0 ? (
            <>
              Showing <span className="font-medium">{startIndex}</span>–
              <span className="font-medium">{endIndex}</span> of{" "}
              <span className="font-medium">{total}</span>
            </>
          ) : (
            <>No tours found</>
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
      <TourFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editingTour}
        onSubmit={handleSubmit}
        mode={editingTour ? "edit" : "create"}
      />

      {/* View */}
      <TourFormModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        initialData={viewTour}
        onSubmit={() => {}}
        mode="view"
      />

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold">
              {tourToDelete?.title_en ?? `#${tourToDelete?.id}`}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteTour.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTour.isPending}
            >
              {deleteTour.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
