import React from "react";
import {
  useTours,
  useCreateTour,
  useUpdateTour,
  useDeleteTour,
  type Tour,
} from "@/api/tours";
import { Button } from "@/components/ui/button";
import { ToursTable } from "@/tables/tours-table";
import { TourFormModal } from "@/components/forms/tour-form";

export default function ToursPage() {
  const { data: tours = [] } = useTours();
  const create = useCreateTour();
  const update = useUpdateTour();
  const remove = useDeleteTour();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Tour | null>(null);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tours</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Add Tour
        </Button>
      </div>

      <ToursTable
        data={tours}
        onEdit={(tour) => {
          setEditing(tour);
          setModalOpen(true);
        }}
        onDelete={(id) => {
          remove.mutate(id);
        }}
      />

      <TourFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={editing}
        onSubmit={async (payload) => {
          if (editing) {
            await update.mutateAsync({ id: editing.id, payload });
          } else {
            await create.mutateAsync(payload);
          }
          setModalOpen(false);
        }}
      />
    </div>
  );
}
