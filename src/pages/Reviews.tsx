"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import toast from "react-hot-toast";

import {
  useReviews,
  useUpdateReview,
  type Review,
  type ReviewsQuery,
} from "@/api/reviews";
import { ReviewsTable } from "@/components/tables/reviews-table";
import { ReviewViewForm } from "@/components/forms/review-view-form";
import { ReviewFormModal } from "@/components/forms/review-form";

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function ReviewsPage() {
  // filters
  const [type, setType] = React.useState<"tour" | "hotel" | "all">("all");
  const [status, setStatus] = React.useState<
    "pending" | "accepted" | "rejected" | "all"
  >("all");
  const [targetId, setTargetId] = React.useState<string>("");

  // pagination
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);

  const dTargetId = useDebounced(targetId);

  React.useEffect(() => {
    setTargetId("");
    setPage(1);
  }, [type]);

  const params = React.useMemo<ReviewsQuery>(() => {
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
  } = useReviews(params);

  React.useEffect(() => setPage(1), [type, status, dTargetId]);

  const errorOnce = React.useRef(false);
  React.useEffect(() => {
    if (isError && !errorOnce.current) {
      toast.error((error as any)?.message ?? "Failed to load reviews.");
      errorOnce.current = true;
    }
  }, [isError, error]);

  const updateReview = useUpdateReview();

  // View modal
  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewReview, setViewReview] = React.useState<Review | null>(null);
  const openView = (r: Review) => {
    setViewReview(r);
    setViewOpen(true);
  };

  // Status modal
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [statusReview, setStatusReview] = React.useState<Review | null>(null);
  const [savingStatus, setSavingStatus] = React.useState(false);

  const openStatus = (r: Review) => {
    setStatusReview(r);
    setStatusOpen(true);
  };

  const submitStatus = async (newStatus: "accepted" | "rejected") => {
    if (!statusReview) return;
    setSavingStatus(true);
    try {
      await toast.promise(
        updateReview.mutateAsync({ id: statusReview.id, status: newStatus }),
        {
          loading: "Saving…",
          success: "Status updated",
          error: (e) => (e as any)?.message || "Failed to update status",
        }
      );
      setStatusOpen(false);
      setStatusReview(null);
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

  const reviews = pageData?.data ?? [];
  const totalPages = pageData?.totalPages ?? 1;
  const currentPage = pageData?.page ?? page;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Reviews Management</h1>
      </div>

      {/* Toolbar */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        {/* Type */}
        <div className="flex flex-col gap-1 md:col-span-2">
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
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-sm text-gray-600">Status</label>
          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rows (stick to the end/right on md+) */}
        <div className="flex items-center gap-2 md:col-start-6 md:justify-self-end self-end">
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

      {/* Table + overlay */}
      <div className="relative rounded-xl border bg-white p-2">
        {isFetching && reviews.length > 0 && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </div>
          </div>
        )}

        <ReviewsTable
          data={reviews}
          onView={openView}
          onOpenStatus={openStatus}
          isLoadingData={isFetching || isLoading}
          isErrorData={isError}
          errorMessage={(error as any)?.message}
        />
      </div>

      {/* Page controls */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          disabled={currentPage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      {/* View modal */}
      <ReviewViewForm
        open={viewOpen}
        onOpenChange={setViewOpen}
        review={viewReview}
      />

      <ReviewFormModal
        open={statusOpen}
        onOpenChange={(v) => {
          setStatusOpen(v);
          if (!v) setStatusReview(null);
        }}
        review={statusReview}
        onSubmit={submitStatus}
        isSubmitting={savingStatus}
      />
    </div>
  );
}
