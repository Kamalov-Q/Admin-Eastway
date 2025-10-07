import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateReview, useUpdateReview, type Review } from "@/api/reviews";

const schema = z.object({
  hotelId: z.number().optional(),
  tourId: z.number().optional(),
  content: z.string().min(2),
});

type Props = { review?: Review; onSuccess: () => void };

export function ReviewForm({ review, onSuccess }: Props) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: review
      ? {
          hotelId: review.hotelId,
          tourId: review.tourId,
          content: review.content,
        }
      : { hotelId: undefined, tourId: undefined, content: "" },
  });

  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (review) {
      await updateMutation.mutateAsync({ id: review.id, ...values });
    } else {
      await createMutation.mutateAsync(values as Partial<Review>);
    }
    onSuccess();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{review ? "Edit Review" : "Add Review"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          type="number"
          placeholder="Hotel ID"
          {...form.register("hotelId", { valueAsNumber: true })}
        />
        <Input
          type="number"
          placeholder="Tour ID"
          {...form.register("tourId", { valueAsNumber: true })}
        />
        <Input placeholder="Review text" {...form.register("content")} />
        <DialogFooter>
          <Button type="submit">{review ? "Update" : "Create"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
