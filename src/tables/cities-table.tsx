import type { City } from "@/api/cities";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";

export function CitiesTable({
  data,
  onView,
  onEdit,
  onDelete,
}: {
  data: City[];
  onView: (c: City) => void;
  onEdit: (c: City) => void;
  onDelete: (id: number) => void;
}) {

  const columns: ColumnDef<City>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name_en", header: "English" },
    { accessorKey: "name_ru", header: "Russian" },
    { accessorKey: "name_es", header: "Spain" },
    { accessorKey: "name_gr", header: "German" },
    { accessorKey: "name_jp", header: "Japan" },
    { accessorKey: "name_zh", header: "Chinese" },
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
          >
            <Eye size={18} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(row.original)}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Pencil size={18} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(row.original.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
