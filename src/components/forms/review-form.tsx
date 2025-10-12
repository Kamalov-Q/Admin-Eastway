"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Review } from "@/api/reviews";

type Acceptable = "accepted" | "rejected";

export function ReviewFormModal({
  open,
  onOpenChange,
  review,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  review: Review | null;
  onSubmit: (status: Acceptable) => Promise<void> | void;
  isSubmitting?: boolean;
}) {
  const initial: Acceptable =
    review?.status === "accepted" || review?.status === "rejected"
      ? review.status
      : "accepted";

  const [status, setStatus] = React.useState<Acceptable>(initial);

  React.useEffect(() => {
    if (open) {
      const preset: Acceptable =
        review?.status === "accepted" || review?.status === "rejected"
          ? review.status
          : "accepted";
      setStatus(preset);
    }
  }, [open, review]);

  if (!review) return null;

  const unchanged =
    review.status === "accepted" || review.status === "rejected"
      ? status === review.status
      : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Status — Review #{review.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Author:</span> {review.author}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Current:</span> {review.status}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">New status</label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Acceptable)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Pending reviews can be changed to <b>Accepted</b> or{" "}
              <b>Rejected</b>.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(status)}
            disabled={isSubmitting || unchanged}
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
