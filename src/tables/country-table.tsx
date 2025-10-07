import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Country } from "@/api/countries";
import { DataTable } from "@/components/ui/data-table";

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
  onDelete: (id: number) => void;
}) {
  const columns: ColumnDef<Country>[] = [
    { accessorKey: "id", header: "ID" },
    ...LANGUAGE_COLUMNS.filter((col) => data.some((c) => c[col.key])).map(
      (col) => ({ accessorKey: col.key, header: col.header })
    ),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(row.original)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="View"
          >
            <Eye size={18} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(row.original)}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Edit"
          >
            <Pencil size={18} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(row.original.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
