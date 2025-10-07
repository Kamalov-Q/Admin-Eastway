import React from "react";
import {
  useHotels,
  useCreateHotel,
  useUpdateHotel,
  useDeleteHotel,
  type Hotel,
} from "@/api/hotels";
import { Button } from "@/components/ui/button";
import { HotelsTable } from "@/tables/hotels-table";
import { HotelFormModal } from "@/components/forms/hotel-form";

export default function HotelsPage() {
  const { data: hotels = [] } = useHotels();
  const create = useCreateHotel();
  const update = useUpdateHotel();
  const remove = useDeleteHotel();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Hotel | null>(null);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Hotels</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Add Hotel
        </Button>
      </div>

      <HotelsTable
        data={hotels}
        onEdit={(hotel) => {
          setEditing(hotel);
          setModalOpen(true);
        }}
        onDelete={(id) => remove.mutate(id)}
      />

      <HotelFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={editing}
        onSubmit={async (payload: Hotel) => {
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
