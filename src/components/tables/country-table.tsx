"use client";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Country } from "@/api/countries";
import { DataTable } from "@/components/ui/data-table";
import ActionsButton from "../ActionsButton";
import ConfirmDialog from "../ConfirmButton";

const LANGUAGE_COLUMNS: { key: keyof Country; header: string }[] = [
  { key: "name_en", header: "English" },
  { key: "name_ru", header: "Russian" },
  { key: "name_es", header: "Spanish" },
  { key: "name_gr", header: "German" },
  { key: "name_jp", header: "Japanese" },
  { key: "name_zh", header: "Chinese" },
];

export function CountriesTable({
  data,
  onView,
  onEdit,
  onDelete,
}: {
  data: Country[];
  onView: (c: Country) => void;
  onEdit: (c: Country) => void;
  onDelete: (id: number) => void | Promise<void>;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Country | null>(null);
  const [deleting, setDeleting] = useState(false);

  const askDelete = (country: Country) => {
    setPendingDelete(country);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      setDeleting(true);
      await Promise.resolve(onDelete(pendingDelete.id));
      setDeleting(false);
      setDeleteOpen(false);
      setPendingDelete(null);
    } catch (e) {
      setDeleting(false);
      console.error("Failed to delete country:", e);
    }
  };

  const columns: ColumnDef<Country>[] = [
    { accessorKey: "id", header: "ID" },
    ...LANGUAGE_COLUMNS.filter((col) => data.some((c) => !!c[col.key])).map(
      (col) => ({ accessorKey: col.key, header: col.header })
    ),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const country = row.original;
        return (
          <ActionsButton
            item={country}
            onView={onView}
            onEdit={onEdit}
            onDelete={() => askDelete(country)}
          />
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        loading={deleting}
        title="You are going to delete this country! Are you sure ???"
        description={
          pendingDelete ? `Country: ${pendingDelete.name_en}` : undefined
        }
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </>
  );
}
