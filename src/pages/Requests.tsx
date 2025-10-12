"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import {
  useRequests,
  useUpdateRequestStatus,
  type Request,
  type RequestsQuery,
} from "@/api/requests";
import { useTours, type Tour } from "@/api/tours";
import { useHotels, type Hotel } from "@/api/hotels";
import { RequestsTable } from "@/tables/requests-table";
import { RequestFormModal } from "@/components/forms/request-form";
import { RequestViewModal } from "@/components/forms/request-view-form";

const ALL = "__ALL__";

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/** Searchable target picker */
function TargetPicker({
  type,
  value,
  onChange,
  tours,
  hotels,
  disabled,
  loading,
}: {
  type: "tour" | "hotel" | "all";
  value: string;
  onChange: (v: string) => void;
  tours: Tour[];
  hotels: Hotel[];
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const currentLabel =
    type === "tour"
      ? tours.find((t) => String(t.id) === value)?.title_en ?? ""
      : type === "hotel"
      ? hotels.find((h) => String(h.id) === value)?.name_en ?? ""
      : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`w-full justify-between border rounded-md px-3 py-2 text-left text-sm ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
          disabled={disabled}
        >
          {type === "all" ? (
            <span className="text-gray-500">All</span>
          ) : loading ? (
            <span className="text-gray-500">Loading…</span>
          ) : value ? (
            <span className="truncate">{currentLabel || `#${value}`}</span>
          ) : (
            <span className="text-gray-500">
              {type === "tour" ? "All tours" : "All hotels"}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput
            placeholder={type === "tour" ? "Search tours…" : "Search hotels…"}
          />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              value={ALL}
              onSelect={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <Check
                className={`mr-2 h-4 w-4 ${
                  value ? "opacity-0" : "opacity-100"
                }`}
              />
              All
            </CommandItem>

            {type === "tour" &&
              tours.map((t) => {
                const v = String(t.id);
                const selected = value === v;
                return (
                  <CommandItem
                    key={t.id}
                    value={v}
                    onSelect={() => {
                      onChange(selected ? "" : v);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selected ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {t.title_en || `#${t.id}`}
                  </CommandItem>
                );
              })}

            {type === "hotel" &&
              hotels.map((h) => {
                const v = String(h.id);
                const selected = value === v;
                return (
                  <CommandItem
                    key={h.id}
                    value={v}
                    onSelect={() => {
                      onChange(selected ? "" : v);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selected ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {h.name_en || `#${h.id}`}
                  </CommandItem>
                );
              })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function RequestsPage() {
  // filters
  const [type, setType] = React.useState<"tour" | "hotel" | "all">("all");
  const [status, setStatus] = React.useState<"active" | "passive" | "all">(
    "all"
  );
  const [targetId, setTargetId] = React.useState<string>("");

  // pagination
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);

  const dTargetId = useDebounced(targetId);

  // Load target lists
  const toursQuery = useTours({ limit: 1000 });
  const hotelsQuery = useHotels({ limit: 1000 });

  const tours: Tour[] = toursQuery.data?.data ?? [];
  const hotels: Hotel[] = hotelsQuery.data?.data ?? [];

  // Reset target when switching type
  React.useEffect(() => {
    setTargetId("");
    setPage(1);
  }, [type]);

  // Params
  const params = React.useMemo<RequestsQuery>(() => {
    const raw = dTargetId.trim();
    const maybeNum = raw ? Number(raw) : undefined;
    const safeId = Number.isFinite(maybeNum as number)
      ? (maybeNum as number)
      : undefined;

    return {
      type: type === "all" ? undefined : type,
      status: status === "all" ? undefined : status,
      page,
      limit,
      ...(type === "tour" ? { tourId: safeId } : {}),
      ...(type === "hotel" ? { hotelId: safeId } : {}),
    };
  }, [type, status, dTargetId, page, limit]);

  const {
    data: pageData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useRequests(params);

  React.useEffect(() => setPage(1), [type, status, dTargetId]);

  // one-time fetch error toast
  const errorOnce = React.useRef(false);
  React.useEffect(() => {
    if (isError && !errorOnce.current) {
      toast.error((error as any)?.message ?? "Failed to load requests.");
      errorOnce.current = true;
    }
  }, [isError, error]);

  const updateStatus = useUpdateRequestStatus();

  // View modal
  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewReq, setViewReq] = React.useState<Request | null>(null);

  // Status modal
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [statusReq, setStatusReq] = React.useState<Request | null>(null);
  const [savingStatus, setSavingStatus] = React.useState(false);

  const submitStatus = async (newStatus: "active" | "passive") => {
    if (!statusReq) return;
    setSavingStatus(true);
    try {
      await toast.promise(
        updateStatus.mutateAsync({ id: statusReq.id, status: newStatus }),
        {
          loading: "Saving…",
          success: "Status updated",
          error: (e) => (e as any)?.message || "Failed to update status",
        }
      );
      setStatusOpen(false);
      setStatusReq(null);
    } finally {
      setSavingStatus(false);
    }
  };

  // Initial skeleton
  if (!pageData && isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-7 w-48 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="border rounded-xl bg-white p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 border-b last:border-b-0"
            >
              <div className="h-5 w-10 bg-gray-200 rounded" />
              <div className="h-5 w-60 bg-gray-200 rounded" />
              <div className="h-5 w-80 bg-gray-200 rounded" />
              <div className="h-5 w-24 bg-gray-200 rounded" />
              <div className="h-5 w-24 bg-gray-200 rounded" />
              <div className="h-5 w-40 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600">Error: {(error as any)?.message}</div>
    );
  }

  const requests = pageData?.data ?? [];
  const totalPages = pageData?.totalPages ?? 1;
  const currentPage = pageData?.page ?? page;
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Requests Management</h1>
      </div>

      {/* Toolbar */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        {/* Type */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Type</label>
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="tour">Tour</SelectItem>
              <SelectItem value="hotel">Hotel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Status</label>
          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="passive">Passive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Target */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">
            {type === "tour" ? "Tour" : type === "hotel" ? "Hotel" : "Target"}
          </label>
          <TargetPicker
            type={type}
            value={targetId}
            onChange={(v) => setTargetId(v === ALL ? "" : v)}
            tours={tours}
            hotels={hotels}
            disabled={type === "all"}
            loading={
              type === "tour"
                ? toursQuery.isLoading
                : type === "hotel"
                ? hotelsQuery.isLoading
                : false
            }
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

        {/* Pagination display */}
        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </div>
        </div>
      </div>

      {/* Table + overlay */}
      <div className="relative rounded-xl border bg-white p-2">
        {isFetching && requests.length > 0 && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </div>
          </div>
        )}

        <RequestsTable
          data={requests}
          onView={(r) => {
            setViewReq(r);
            setViewOpen(true);
          }}
          onOpenStatus={(r) => {
            setStatusReq(r);
            setStatusOpen(true);
          }}
          isLoadingData={isFetching || isLoading}
          isErrorData={isError}
          errorMessage={(error as any)?.message}
        />
      </div>

      {/* Page controls */}
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

      {/* View modal */}
      <RequestViewModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        request={viewReq}
      />

      {/* Status modal */}
      <RequestFormModal
        open={statusOpen}
        onOpenChange={(v) => {
          setStatusOpen(v);
          if (!v) setStatusReq(null);
        }}
        request={statusReq}
        onSubmit={async (s) => {
          await submitStatus(s);
        }}
        isSubmitting={savingStatus}
      />
    </div>
  );
}
