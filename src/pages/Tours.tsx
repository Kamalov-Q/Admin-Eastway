"use client";
import { useState } from "react";
import type { Tour } from "@/api/tours";
import {
  useTours,
  useCreateTour,
  useUpdateTour,
  useDeleteTour,
} from "@/api/tours";
import { Button } from "@/components/ui/button";
import { ToursTable } from "@/tables/tours-table";
import { TourFormModal } from "@/components/forms/tour-form";

export default function ToursPage() {
  const { data: tours = [], isLoading } = useTours();
  const createTour = useCreateTour();
  const updateTour = useUpdateTour();
  const deleteTour = useDeleteTour();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);

  const openAddModal = () => {
    setEditingTour(null);
    setModalOpen(true);
  };

  const openEditModal = (tour: Tour) => {
    setEditingTour(tour);
    setModalOpen(true);
  };

  const handleSubmit = async (values: Partial<Tour>) => {
    try {
      if (editingTour) {
        await updateTour.mutateAsync({ id: editingTour.id, payload: values });
      } else {
        await createTour.mutateAsync(values);
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to save tour:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTour.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete tour:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Tours Management</h1>
        <Button onClick={openAddModal}>+ Add Tour</Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ToursTable
          data={tours}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      <TourFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={editingTour}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
