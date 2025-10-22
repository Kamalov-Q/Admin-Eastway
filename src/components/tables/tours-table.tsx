import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { Tour } from "@/api/tours";
import { useCities } from "@/api/cities";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { useTourCategories } from "@/api/tour-category";

type Props = {
  data: Tour[];
  onEdit: (tour: Tour) => void;
  onDelete: (id: number) => void | Promise<void>;
  onView: (tour: Tour) => void;
};

export function ToursTable({ data, onEdit, onDelete, onView }: Props) {
  const { data: cities = [] } = useCities();
  const cityMap = useMemo(() => {
    const m = new Map<number, { name_en: string }>();
    for (const c of cities) m.set(c.id, { name_en: c.name_en });
    return m;
  }, [cities]);
  const cityName = (id?: number) =>
    typeof id === "number" ? cityMap.get(id)?.name_en ?? String(id) : "-";

  const { data: categories = [] } = useTourCategories?.() ?? {
    data: [] as any[],
  };
  const categoryMap = useMemo(() => {
    const m = new Map<number, { name_en?: string }>();
    for (const c of categories as Array<{ id: number; name_en?: string }>) {
      m.set(c.id, { name_en: c.name_en });
    }
    return m;
  }, [categories]);
  const categoryName = (id?: number, fallbackObj?: any) => {
    if (fallbackObj?.name_en) return fallbackObj.name_en;
    return typeof id === "number"
      ? categoryMap.get(id)?.name_en ?? String(id)
      : "-";
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Tour | null>(null);
  const [deleting, setDeleting] = useState(false);

  const askDelete = (tour: Tour) => {
    setPendingDelete(tour);
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
      console.error("Failed to delete tour:", e);
    }
  };

  const ImagesCell = ({ images }: { images?: { url: string }[] }) => {
    const urls = (images ?? []).map((i) => i.url).filter(Boolean);
    if (!urls.length) return <span>-</span>;

    const first = urls[0];
    const rest = Math.max(0, urls.length - 1);

    return (
      <div className="relative inline-block">
        <img
          src={first}
          alt="img-0"
          className="w-10 h-8 object-cover rounded"
        />
        {rest > 0 && (
          <span
            className="pointer-events-none absolute -bottom-1 -right-1 rounded-full bg-black/70 text-white text-[10px] leading-none px-1.5 py-1 shadow-md"
            title={`+${rest} more`}
          >
            +{rest}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="rounded-md">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[200px]">Name (EN)</TableHead>
              <TableHead className="w-[200px]">Name (RU)</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[200px]">Category</TableHead>
              <TableHead className="w-[80px]">Days</TableHead>
              <TableHead className="w-[180px]">Images</TableHead>
              <TableHead className="w-[120px]">Thumbnail</TableHead>
              <TableHead className="w-[200px]">City (EN)</TableHead>
              <TableHead className="w-[250px]">Address (EN)</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((tour) => (
              <TableRow key={tour.id}>
                <TableCell>{tour.id}</TableCell>
                <TableCell>
                  <div
                    className="truncate max-w-[180px]"
                    title={tour.title_en || ""}
                  >
                    {tour.title_en || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className="truncate max-w-[180px]"
                    title={tour.title_ru || ""}
                  >
                    {tour.title_ru || "-"}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{tour.type || "-"}</TableCell>

                {/* ✅ NEW: Category cell (works with categoryId or category object) */}
                <TableCell>
                  <div
                    className="truncate max-w-[200px]"
                    title={
                      categoryName(
                        (tour as any).categoryId,
                        (tour as any).category
                      ) || ""
                    }
                  >
                    {categoryName(
                      (tour as any).categoryId,
                      (tour as any).category
                    )}
                  </div>
                </TableCell>

                <TableCell>{tour.days ?? "-"}</TableCell>
                <TableCell>
                  <ImagesCell images={tour.images} />
                </TableCell>
                <TableCell>
                  {tour.thumbnail ? (
                    <img
                      src={tour.thumbnail}
                      alt="thumb"
                      className="w-14 h-10 object-cover rounded"
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <div
                    className="truncate max-w-[150px]"
                    title={cityName(tour.cityId)}
                  >
                    {cityName(tour.cityId)}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className="truncate max-w-[150px]"
                    title={tour.address_en || ""}
                  >
                    {tour.address_en || "-"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onView(tour)}>
                        <Eye className="h-4 w-4 mr-2" /> Show
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(tour)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => askDelete(tour)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={deleteOpen} onOpenChange={onCloseDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tour?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? (
                <>
                  You are about to delete <b>#{pendingDelete.id}</b>
                  {pendingDelete.title_en ? (
                    <>
                      {" "}
                      (<i>{pendingDelete.title_en}</i>)
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
