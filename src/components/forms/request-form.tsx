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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Request } from "@/api/requests";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: Request | null;
  onSubmit: (status: "active" | "passive") => Promise<void> | void;
  isSubmitting?: boolean;
};

export function RequestFormModal({
  open,
  onOpenChange,
  request,
  onSubmit,
  isSubmitting,
}: Props) {
  const [value, setValue] = React.useState<"active" | "passive">("active");

  React.useEffect(() => {
    if (open && request?.status) {
      setValue(request.status);
    }
  }, [open, request?.status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {request ? (
              <>
                Request <b>#{request.id}</b> ({request.firstName}{" "}
                {request.lastName})
              </>
            ) : (
              "—"
            )}
          </div>

          <RadioGroup
            value={value}
            onValueChange={(v: "active" | "passive") => setValue(v)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="req-active" value="active" />
              <Label htmlFor="req-active">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="req-passive" value="passive" />
              <Label htmlFor="req-passive">Passive</Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={!!isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={() => onSubmit(value)} disabled={!!isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
