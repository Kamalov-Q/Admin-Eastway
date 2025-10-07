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
import { useCreateRequest, useUpdateRequest } from "@/api/requests";

const schema = z.object({
  hotelId: z.number().optional(),
  tourId: z.number().optional(),
  message: z.string().min(2),
});

type Props = { request?: Request; onSuccess: () => void };

export function RequestForm({ request, onSuccess }: Props) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: request
      ? {
          hotelId: request.hotelId,
          tourId: request.tourId,
          message: request.message,
        }
      : { hotelId: undefined, tourId: undefined, message: "" },
  });

  const createMutation = useCreateRequest();
  const updateMutation = useUpdateRequest();

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (request) {
      await updateMutation.mutateAsync({ id: request.id, data: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    onSuccess();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{request ? "Edit Request" : "Add Request"}</DialogTitle>
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
        <Input placeholder="Message" {...form.register("message")} />
        <DialogFooter>
          <Button type="submit">{request ? "Update" : "Create"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
