"use client";

import { useMemo, useState } from "react";
import type { City } from "@/api/cities";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
// If you have a countries hook, we'll use it to show country name_en by id
import { useCountries } from "@/api/countries";

export function CitiesTable({
  data,
  onView,
  onEdit,
  onDelete,
}: {
  data: City[];
  onView: (c: City) => void;
  onEdit: (c: City) => void;
  onDelete: (id: number) => void | Promise<void>;
}) {
  // Optional: build a map of countryId -> country.name_en
  const { data: countries = [] } = useCountries?.() ?? { data: [] as any[] };
  const countryMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of countries as any[]) {
      if (c?.id != null) m.set(c.id, c.name_en ?? "");
    }
    return m;
  }, [countries]);

  const getCountryName = (city: City) => {
    // Try nested, then by id map, else dash
    const nested = (city as any)?.country?.name_en;
    const byId =
      typeof (city as any)?.countryId === "number"
        ? countryMap.get((city as any).countryId)
        : undefined;
    return nested || byId || "-";
  };

  // Delete confirmation dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<City | null>(null);
  const [deleting, setDeleting] = useState(false);

  const askDelete = (city: City) => {
    setPendingDelete(city);
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
      // keep dialog open if failed
      console.error("Failed to delete city:", e);
    }
  };

  const columns: ColumnDef<City>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name_en", header: "English" },
    { accessorKey: "name_ru", header: "Russian" },
    { accessorKey: "name_es", header: "Spain" },
    { accessorKey: "name_gr", header: "German" },
    { accessorKey: "name_jp", header: "Japan" },
    { accessorKey: "name_zh", header: "Chinese" },
    {
      id: "country",
      header: "Country (EN)",
      cell: ({ row }) => <span>{getCountryName(row.original)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const city = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onView(city)}>
                  <Eye className="h-4 w-4 mr-2" /> Show
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(city)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => askDelete(city)}
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

      <AlertDialog open={deleteOpen} onOpenChange={onCloseDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this city?</AlertDialogTitle>
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
