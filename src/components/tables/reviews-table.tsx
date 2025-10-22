"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Eye, MoreHorizontal, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import type { Review } from "@/api/reviews";

type Props = {
  data: Review[];
  onView: (r: Review) => void;
  onOpenStatus: (r: Review) => void; // open Update Status modal
  onDelete?: (id: number) => Promise<unknown> | void;
  isLoadingData?: boolean;
  isErrorData?: boolean;
  errorMessage?: string;
};

const StatusBadge = ({ status }: { status: Review["status"] }) => {
  const map: Record<Review["status"], { label: string; cls: string }> = {
    pending: {
      label: "Pending",
      cls: "bg-amber-100 text-amber-700 border-amber-200",
    },
    accepted: {
      label: "Accepted",
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-rose-100 text-rose-700 border-rose-200",
    },
  };
  return (
    <Badge className={`border ${map[status].cls}`}>{map[status].label}</Badge>
  );
};

const Stars = ({ rating }: { rating: number }) => {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex gap-[2px]" aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`w-4 h-4 ${i < n ? "fill-yellow-400" : "fill-gray-200"}`}
        >
          <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.564-.954L10 0l2.948 5.956 6.564.954-4.756 4.635 1.122 6.545z" />
        </svg>
      ))}
    </div>
  );
};

export function ReviewsTable({
  data,
  onView,
  onOpenStatus,
  onDelete,
  isLoadingData,
  isErrorData,
  errorMessage,
}: Props) {
  const errOnce = useRef(false);
  useEffect(() => {
    if (isErrorData && !errOnce.current) {
      errOnce.current = true;
      toast.error(errorMessage || "Failed to load reviews.");
    }
  }, [isErrorData, errorMessage]);

  // delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  const onCloseDelete = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) setPending(null);
  };
  const confirmDelete = async () => {
    if (!onDelete || !pending) return;
    setDeleting(true);
    try {
      await toast.promise(Promise.resolve(onDelete(pending.id)), {
        loading: "Deleting review…",
        success: "Review deleted",
        error: "Failed to delete review",
      });
      setDeleteOpen(false);
      setPending(null);
    } finally {
      setDeleting(false);
    }
  };

  const LoadingRow = () => (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5 w-10" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[200px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[360px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[120px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[120px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[220px]" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 ml-auto rounded" />
      </TableCell>
    </TableRow>
  );

  const targetLabel = (r: Review) => {
    if (r.type === "tour" || r.tourId)
      return r.tour?.title_en
        ? `Tour: ${r.tour.title_en}`
        : `Tour #${r.tourId}`;
    if (r.type === "hotel" || r.hotelId)
      return r.hotel?.name_en
        ? `Hotel: ${r.hotel.name_en}`
        : `Hotel #${r.hotelId}`;
    return "-";
  };

  return (
    <div className="relative rounded-xl bg-white p-2">
      {isLoadingData && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                className="stroke-gray-400"
                fill="none"
                strokeWidth="4"
              />
            </svg>
            Loading…
          </div>
        </div>
      )}

      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">ID</TableHead>
            <TableHead className="w-[200px]">Author</TableHead>
            <TableHead className="w-[360px]">Comment</TableHead>
            <TableHead className="w-[120px]">Rating</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[220px]">Target</TableHead>
            <TableHead className="text-right w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoadingData &&
            Array.from({ length: 6 }).map((_, i) => <LoadingRow key={i} />)}

          {!isLoadingData &&
            data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>
                  <div className="truncate max-w-[200px]" title={r.author}>
                    {r.author}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="truncate max-w-[360px]" title={r.comment}>
                    {r.comment}
                  </div>
                </TableCell>
                <TableCell>
                  <Stars rating={r.rating} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell>
                  <div
                    className="truncate max-w-[220px]"
                    title={targetLabel(r)}
                  >
                    {targetLabel(r)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onView(r)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenStatus(r)}>
                        <Edit3 className="h-4 w-4 mr-2" /> Update status…
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

          {!isLoadingData && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <div className="flex justify-center py-10 text-sm text-gray-500">
                  No reviews found.
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={onCloseDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending ? (
                <>
                  You are about to delete review <b>#{pending.id}</b> by{" "}
                  <i>{pending.author}</i>. This action cannot be undone.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
