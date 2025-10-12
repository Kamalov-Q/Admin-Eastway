
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Star } from "lucide-react";
import toast from "react-hot-toast";
import type { Review } from "@/api/reviews";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  review: Review | null;
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
    <div className="flex items-center gap-1" aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < n ? "fill-yellow-400 stroke-yellow-400" : "stroke-gray-300"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">({n}/5)</span>
    </div>
  );
};

const Avatar = ({ name }: { name: string }) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <div
      className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white grid place-items-center text-sm font-semibold shadow-sm"
      aria-hidden
    >
      {initials || "?"}
    </div>
  );
};

function fmtDate(iso?: string) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function ReviewViewForm({ open, onOpenChange, review }: Props) {
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const targetLabel =
    review?.type === "tour" || review?.tourId
      ? review?.tour?.title_en
        ? `Tour: ${review.tour.title_en}`
        : review?.tourId
        ? `Tour #${review.tourId}`
        : "-"
      : review?.type === "hotel" || review?.hotelId
      ? review?.hotel?.name_en
        ? `Hotel: ${review.hotel.name_en}`
        : review?.hotelId
        ? `Hotel #${review.hotelId}`
        : "-"
      : "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl">
              {review ? `Review #${review.id}` : "Review"}
            </DialogTitle>
            <div className="text-sm text-gray-500">
              {review ? fmtDate(review.createdAt) : ""}
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {!review ? (
            // Skeleton
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="h-4 w-40 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-20 w-full bg-gray-200 rounded" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top row: avatar, author, stars, status */}
              <div className="flex items-start gap-4">
                <Avatar name={review.author || "Unknown"} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-medium">{review.author || "-"}</div>
                    <Stars rating={review.rating} />
                    <StatusBadge status={review.status} />
                  </div>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium capitalize">
                        {review.type ??
                          (review.tourId
                            ? "tour"
                            : review.hotelId
                            ? "hotel"
                            : "-")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                      <span className="text-gray-500">Target:</span>
                      <span className="font-medium truncate">
                        {targetLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* Comment */}
              <div>
                <div className="mb-2 text-sm font-medium text-gray-800">
                  Comment
                </div>
                <div className="rounded-lg border bg-white p-3 text-sm leading-relaxed whitespace-pre-wrap break-words max-h-56 overflow-auto">
                  {review.comment || "-"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6">
          {review && (
            <>
              <Button
                variant="outline"
                onClick={() => copy(String(review.id), "Review ID")}
                className="mr-auto"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy ID
              </Button>
              <Button
                variant="outline"
                onClick={() => copy(review.comment || "", "Comment")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Comment
              </Button>
            </>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
