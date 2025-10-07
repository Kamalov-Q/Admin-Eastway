import { useEffect } from "react";
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
import type { Hotel } from "@/api/hotels";

const schema = z.object({
  name_en: z.string().min(2, "Hotel name is required"),
  cityId: z.number().min(1, "City ID is required"),
  categoryId: z.number().min(1, "Category ID is required"),
  price: z.number().min(1, "Price must be greater than 0"),
  address: z.string().min(3, "Address is required"),
});

export type HotelFormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Hotel | null;
  onSubmit: (values: HotelFormValues) => Promise<void>;
};

export function HotelFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: Props) {
  const form = useForm<HotelFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name_en: "",
      cityId: 0,
      categoryId: 0,
      price: 0,
      address: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name_en: initialData.name_en || "",
        cityId: initialData.cityId || 0,
        address: initialData?.city?.name_en,
      });
    } else {
      form.reset({
        name_en: "",
        cityId: 0,
        address: "",
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (values: HotelFormValues) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Hotel" : "Add Hotel"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Input placeholder="Hotel name" {...form.register("name_en")} />
          <Input
            type="number"
            placeholder="City ID"
            {...form.register("cityId", { valueAsNumber: true })}
          />
          <Input
            type="number"
            placeholder="Category ID"
            {...form.register("categoryId", { valueAsNumber: true })}
          />
          <Input
            type="number"
            placeholder="Price"
            {...form.register("price", { valueAsNumber: true })}
          />
          <Input placeholder="Address" {...form.register("address")} />

          <DialogFooter>
            <Button type="submit">{initialData ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
