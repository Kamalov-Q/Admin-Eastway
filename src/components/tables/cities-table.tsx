import { useMemo, useState } from "react";
import type { City } from "@/api/cities";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useCountries } from "@/api/countries";
import ActionsButton from "../ActionsButton";
import ConfirmDialog from "../ConfirmButton";

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
  const countriesQuery = useCountries({ limit: 100 });
  const countriesRaw = countriesQuery?.data;
  const countries: any[] = Array.isArray(countriesRaw)
    ? countriesRaw
    : countriesRaw?.data ?? [];

  const countryMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of countries) {
      if (c?.id != null) m.set(c.id, c.name_en ?? "");
    }
    return m;
  }, [countries]);

  const getCountryName = (city: City) => {
    const nested = (city as any)?.country?.name_en;
    const byId =
      typeof (city as any)?.countryId === "number"
        ? countryMap.get((city as any).countryId)
        : undefined;
    return nested || byId || "-";
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<City | null>(null);
  const [deleting, setDeleting] = useState(false);

  const askDelete = (city: City) => {
    setPendingDelete(city);
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
      console.error("Failed to delete city:", e);
    }
  };

  const columns: ColumnDef<City>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name_en", header: "English" },
    { accessorKey: "name_ru", header: "Russian" },
    { accessorKey: "name_es", header: "Spanish" },
    { accessorKey: "name_gr", header: "German" },
    { accessorKey: "name_jp", header: "Japanese" },
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
          <ActionsButton
            item={city}
            onView={onView}
            onEdit={onEdit}
            onDelete={() => askDelete(city)}
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
