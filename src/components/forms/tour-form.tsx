import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Tour } from "@/api/tours";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  days: z.number().min(1, "At least 1 day"),
  type: z.string().min(1, "Type is required"),
  cityId: z.number().min(1, "City ID is required"),
});

export type TourFormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  initialData?: Tour | null;
  onSubmit: (values: TourFormValues) => Promise<void> | void;
};

export function TourFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: Props) {
  const form = useForm<TourFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          title: initialData.title_en,
          days: initialData.days,
          type: initialData.type,
          cityId: initialData.cityId,
        }
      : { title: "", days: 1, type: "", cityId: 0 },
  });

  // Reset form whenever initialData changes (important for edit vs create)
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title_en,
        days: initialData.days,
        type: initialData.type,
        cityId: initialData.cityId,
      });
    } else {
      form.reset({ title: "", days: 1, type: "", cityId: 0 });
    }
  }, [initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Tour" : "Add Tour"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          className="space-y-4"
        >
          <Input placeholder="Title" {...form.register("title")} />
          <Input
            type="number"
            placeholder="Days"
            {...form.register("days", { valueAsNumber: true })}
          />
          <Input placeholder="Type" {...form.register("type")} />
          <Input
            type="number"
            placeholder="City ID"
            {...form.register("cityId", { valueAsNumber: true })}
          />

          <DialogFooter>
            <Button type="submit">{initialData ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
