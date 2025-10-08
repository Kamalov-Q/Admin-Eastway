"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Country } from "@/api/countries";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  // Delete confirmation (same behavior/style as Tours/Cities tables)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Country | null>(null);
  const [deleting, setDeleting] = useState(false);

  const askDelete = (country: Country) => {
    setPendingDelete(country);
    setDeleteOpen(true);
  };

  const onCloseDelete = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) setPendingDelete(null);
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
      // keep dialog open if deletion failed
      console.error("Failed to delete country:", e);
    }
  };

  const columns: ColumnDef<Country>[] = [
    { accessorKey: "id", header: "ID" },
    // only render language columns that exist at least once in data
    ...LANGUAGE_COLUMNS.filter((col) => data.some((c) => !!c[col.key])).map(
      (col) => ({ accessorKey: col.key, header: col.header })
    ),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const country = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onView(country)}>
                  <Eye className="h-4 w-4 mr-2" /> Show
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(country)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => askDelete(country)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={onCloseDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this country?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? (
                <>
                  You are about to delete <b>#{pendingDelete.id}</b>
                  {pendingDelete.name_en ? (
                    <>
                      {" "}
                      (<i>{pendingDelete.name_en}</i>)
                    </>
                  ) : null}
                  . This action cannot be undone.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
