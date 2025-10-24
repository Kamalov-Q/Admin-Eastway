import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCities,
  useDeleteCity,
  useCreateCity,
  useUpdateCity,
  type City,
} from "@/api/cities";
import { CitiesTable } from "@/components/tables/cities-table";
import { CityFormModal } from "@/components/forms/city-form";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountries, type Country } from "@/api/countries";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

/** Debounce helper */
function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

const ALL_COUNTRIES = "__ALL__";

const PREFERRED_NAME_KEY = "name_en" as keyof Country | "name_en";

export default function CitiesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [countryFilter, setCountryFilter] = useState("");

  const {
    data: countries,
    isLoading: countryLoading,
    isError: countryError,
  } = useCountries();

  const {
    data: cities,
    isLoading,
    isFetching,
    isError,
    error,
  } = useCities({
    country: countryFilter ?? "",
    page,
    limit,
    name: debouncedSearch,
  });

  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();

  /** Reset to first page when search or country changes */
  useEffect(() => setPage(1), [debouncedSearch, countryFilter]);

  /** One-time toast for errors */
  const errorNotifiedRef = useRef(false);
  useEffect(() => {
    if (errorNotifiedRef.current) return;
    if (isError) {
      toast.error((error as any)?.message ?? "Failed to load cities.");
      errorNotifiedRef.current = true;
    } else if (countryError) {
      toast.error("Failed to load countries.");
      errorNotifiedRef.current = true;
    }
  }, [isError, error, countryError]);

  const openCreate = () => {
    setSelectedCity(null);
    setModalMode("create");
    setModalOpen(true);
  };
  const openEdit = (city: City) => {
    setSelectedCity(city);
    setModalMode("edit");
    setModalOpen(true);
  };
  const openView = (city: City) => {
    setSelectedCity(city);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleSubmit = async (
    payload: Partial<City>,
    mode: "create" | "edit",
    city?: City | null
  ) => {
    if (mode === "edit" && city?.id) {
      await toast.promise(updateCity.mutateAsync({ id: city.id, payload }), {
        loading: "Updating city…",
        success: `City updated${
          payload?.name_en ? ` (${payload.name_en})` : ""
        }`,
        error: (e) => (e as any)?.message || "Failed to update city",
      });
    } else {
      await toast.promise(createCity.mutateAsync(payload), {
        loading: "Creating city…",
        success: `City created${
          payload?.name_en ? ` (${payload.name_en})` : ""
        }`,
        error: (e) => (e as any)?.message || "Failed to create city",
      });
    }
    setModalOpen(false);
    setSelectedCity(null);
  };

  const handleDelete = async (id: number) => {
    await toast.promise(deleteCity.mutateAsync(id), {
      loading: "Deleting city…",
      success: "City deleted",
      error: (e) => (e as any)?.message || "Failed to delete city",
    });
  };

  // ------------------ Country helpers ------------------

  /** Normalize countries into a plain array (supports both Country[] and { data: Country[] }) */
  const countriesArray: Country[] = useMemo(() => {
    if (!countries) return [];
    return Array.isArray(countries) ? countries : (countries as any).data ?? [];
  }, [countries]);

  /** Choose the localized name string to send to the API (country?.name_xx) */
  const countryNameForQuery = (c: Country) => {
    const keys: (keyof Country | string)[] = [
      PREFERRED_NAME_KEY, // primary choice, e.g., name_en
      "name_ru",
      "name_es",
      "name_gr",
      "name_jp",
      "name_zh",
    ];
    for (const k of keys) {
      const v = (c as any)[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };

  /** Friendly label to display in the Select list */
  const countryLabel = (c: Country, fallback: string) =>
    c.name_en ??
    c.name_ru ??
    c.name_es ??
    c.name_gr ??
    c.name_jp ??
    c.name_zh ??
    fallback;

  const sortedCountries = useMemo(() => {
    const seen = new Set<string>();
    const items = countriesArray
      .map((c) => {
        const value = countryNameForQuery(c);
        if (!value) return null;

        const idish =
          (c as any).id ?? (c as any).code ?? (c as any).iso2 ?? value;
        const key = `${String(idish)}__${value}`;

        const label = countryLabel(c, value);
        return { key, value, label };
      })
      .filter(Boolean) as { key: string; value: string; label: string }[];

    const deduped: { key: string; value: string; label: string }[] = [];
    for (const it of items) {
      if (!seen.has(it.key)) {
        seen.add(it.key);
        deduped.push(it);
      }
    }

    deduped.sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    );
    return deduped;
  }, [countriesArray]);

  // ------------------ Loading skeleton ------------------

  if (!cities && isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Skeleton className="h-9 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        <div className="border rounded-lg p-2 bg-white">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 border-b last:border-b-0"
            >
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-5 w-56" />
              <div className="ml-auto flex items-center gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ------------------ Error boundary ------------------

  if (isError) {
    return (
      <div className="p-6 text-red-600">Error: {(error as any)?.message}</div>
    );
  }

  // ------------------ UI ------------------

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cities Management</h1>
        <Button onClick={openCreate}>+ Add City</Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          placeholder="Search city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {countryLoading ? (
          <Skeleton className="h-9 w-64" />
        ) : (
          <Select
            value={countryFilter === "" ? ALL_COUNTRIES : countryFilter}
            onValueChange={(v) =>
              setCountryFilter(v === ALL_COUNTRIES ? "" : v)
            }
            disabled={countryLoading || countryError}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue
                placeholder={
                  countryLoading ? "Loading countries…" : "Filter by country…"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_COUNTRIES}>All countries</SelectItem>

              {/* Error / Empty states */}
              {countryError && (
                <SelectItem value="__ERROR__" disabled>
                  Failed to load countries
                </SelectItem>
              )}
              {!countryError &&
                !countryLoading &&
                sortedCountries.length === 0 && (
                  <SelectItem value="__EMPTY__" disabled>
                    No countries
                  </SelectItem>
                )}

              {sortedCountries.map(({ key, value, label }) => (
                <SelectItem key={key} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rows per page:</label>
          <select
            className="border rounded-md py-1.5 px-2 text-sm"
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
      </div>

      <div className="relative border rounded-lg p-2 bg-white">
        {isFetching && (cities?.length ?? 0) > 0 && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </div>
          </div>
        )}

        <CitiesTable
          data={cities || []}
          onView={openView}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>

      <CityFormModal
        open={modalOpen}
        initialData={selectedCity}
        mode={modalMode}
        onOpenChange={(v) => {
          if (!v) {
            setModalOpen(false);
            setSelectedCity(null);
          } else {
            setModalOpen(true);
          }
        }}
        onSubmit={(payload) =>
          modalMode !== "view" &&
          handleSubmit(payload, modalMode as "create" | "edit", selectedCity)
        }
      />
    </div>
  );
}
