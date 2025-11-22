import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  useRequests,
  useUpdateRequestStatus,
  type Request,
  type RequestsQuery,
} from "@/api/requests";
import { RequestsTable } from "@/components/tables/requests-table";
import { RequestFormModal } from "@/components/forms/request-form";
import { RequestViewModal } from "@/components/forms/request-view-form";

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
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

  const errorOnce = React.useRef(false);
  React.useEffect(() => {
    if (isError && !errorOnce.current) {
      toast.error((error as any)?.message ?? "Failed to load requests.");
      errorOnce.current = true;
    }
    if (!isError) errorOnce.current = false;
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

  // ---------- Extract pagination data from new structure (MUST BE BEFORE EARLY RETURNS) ----------
  const paginationData = React.useMemo(() => {
    let requests: Request[] = [];
    let total = 0;
    let totalPages = 1;
    let currentPage = page;
    let hasNextPage = false;
    let hasPrevPage = false;

    if (pageData) {
      // New structure: { data: Request[], meta: { ... } }
      requests = pageData.data ?? [];
      const meta = pageData.meta;

      if (meta) {
        total = meta.total ?? 0;
        totalPages = meta.totalPages ?? 1;
        currentPage = meta.page ?? page;
        hasNextPage = meta.hasNextPage ?? false;
        hasPrevPage = meta.hasPrevPage ?? false;
      }
    }

    return {
      requests,
      total,
      totalPages,
      currentPage,
      hasNextPage,
      hasPrevPage,
    };
  }, [pageData, page]);

  const { requests, total, totalPages, currentPage, hasNextPage, hasPrevPage } =
    paginationData;

  const canPrev = hasPrevPage || currentPage > 1;
  const canNext = hasNextPage || currentPage < totalPages;

  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(total, currentPage * limit);

  // Initial skeleton (AFTER all hooks)
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

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Requests Management</h1>
      </div>

      {/* Toolbar (now includes page indicator like Tours) */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-7 gap-3">
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

        {/* Rows per page */}
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

      {/* Footer: range + pagination */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          {total > 0 ? (
            <>
              Showing <span className="font-medium">{startIndex}</span>–
              <span className="font-medium">{endIndex}</span> of{" "}
              <span className="font-medium">{total}</span>
            </>
          ) : (
            <>No cities found</>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
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
