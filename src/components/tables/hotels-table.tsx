"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Hotel } from "@/api/hotels";
import { useCities, type City } from "@/api/cities";

type Props = {
  data: Hotel[];
  onEdit: (hotel: Hotel) => void;
  onDelete: (id: number) => void | Promise<void>;
  onView: (hotel: Hotel) => void;
  isLoadingData?: boolean;
  isErrorData?: boolean;
  errorMessage?: string;
};

export function HotelsTable({
  data,
  onEdit,
  onDelete,
  onView,
  isLoadingData,
  isErrorData,
  errorMessage,
}: Props) {
  const {
    data: citiesRaw,
    isError: isCitiesError,
    error: citiesError,
    isLoading: isCitiesLoading,
  } = useCities();

  // Normalize cities data to City[]
  const cities: City[] = useMemo(() => {
    if (!citiesRaw) return [];
    if (Array.isArray(citiesRaw)) return citiesRaw as City[];
    return ((citiesRaw as any)?.data ?? []) as City[];
  }, [citiesRaw]);

  const cityMap = useMemo(() => {
    const m = new Map<number, { name_en: string }>();
    for (const c of cities) {
      if (c.id && c.name_en) {
        m.set(c.id, { name_en: c.name_en });
      }
    }
    return m;
  }, [cities]);

  const cityName = (id?: number) =>
    typeof id === "number" ? cityMap.get(id)?.name_en ?? String(id) : "-";

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Hotel | null>(null);
  const [deleting, setDeleting] = useState(false);

  const askDelete = (hotel: Hotel) => {
    setPendingDelete(hotel);
    setDeleteOpen(true);
  };
  const onCloseDelete = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const id = pendingDelete.id;
    const label = pendingDelete.name_en
      ? `#${id} (${pendingDelete.name_en})`
      : `#${id}`;

    try {
      await toast.promise(Promise.resolve(onDelete(id)), {
        loading: "Deleting hotel…",
        success: `Hotel deleted ${label}`,
        error: "Failed to delete hotel",
      });
      setDeleteOpen(false);
      setPendingDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
    }
  };

  const dataErrorShown = useRef(false);
  const citiesErrorShown = useRef(false);

  useEffect(() => {
    if (isErrorData && !dataErrorShown.current) {
      toast.error(errorMessage || "Failed to load hotels.");
      dataErrorShown.current = true;
    }
    if (!isErrorData) {
      dataErrorShown.current = false;
    }
  }, [isErrorData, errorMessage]);

  useEffect(() => {
    if (isCitiesError && !citiesErrorShown.current) {
      toast.error((citiesError as any)?.message ?? "Failed to load cities.");
      citiesErrorShown.current = true;
    }
    if (!isCitiesError) {
      citiesErrorShown.current = false;
    }
  }, [isCitiesError, citiesError]);

  // Cells
  const ImagesCell = ({ images }: { images?: { url: string }[] }) => {
    const urls = (images ?? []).map((i) => i.url).filter(Boolean);
    if (!urls.length) return <span>-</span>;

    const first = urls[0];
    const rest = Math.max(0, urls.length - 1);

    return (
      <div className="relative inline-block">
        <img
          src={first}
          alt="Hotel image"
          className="w-10 h-8 object-cover rounded"
        />

        {rest > 0 && (
          <span
            className="pointer-events-none absolute -bottom-1 -right-1 rounded-full bg-black/70 text-white text-[10px] leading-none px-1.5 py-0.5 shadow-md"
            title={`+${rest} more`}
          >
            +{rest}
          </span>
        )}
      </div>
    );
  };

  const LoadingRow = () => (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5 w-10" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[180px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[180px]" />
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Skeleton className="h-8 w-10 rounded" />
          <Skeleton className="h-8 w-10 rounded" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-10 w-14 rounded" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-160px" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[200px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-12" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 ml-auto rounded" />
      </TableCell>
    </TableRow>
  );

  const showOverlay = isLoadingData || isCitiesLoading;

  return (
    <>
      <div className="relative rounded-md bg-white">
        {/* Subtle loading overlay */}
        {showOverlay && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-md">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          </div>
        )}

        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-80px">ID</TableHead>
              <TableHead className="w-[220px]">Name (EN)</TableHead>
              <TableHead className="w-[220px]">Name (RU)</TableHead>
              <TableHead className="w-[180px]">Images</TableHead>
              <TableHead className="w-[120px]">Thumbnail</TableHead>
              <TableHead className="w-[200px]">City (EN)</TableHead>
              <TableHead className="w-[250px]">Address (EN)</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Loading skeleton rows */}
            {isLoadingData &&
              Array.from({ length: 6 }).map((_, i) => (
                <LoadingRow key={`s-${i}`} />
              ))}

            {/* Data rows */}
            {!isLoadingData &&
              data.map((hotel) => (
                <TableRow key={hotel.id}>
                  <TableCell>{hotel.id}</TableCell>

                  <TableCell>
                    <div
                      className="truncate max-w-[220px]"
                      title={hotel.name_en || ""}
                    >
                      {hotel.name_en || "-"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div
                      className="truncate max-w-[220px]"
                      title={hotel.name_ru || ""}
                    >
                      {hotel.name_ru || "-"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <ImagesCell images={hotel.images} />
                  </TableCell>

                  <TableCell>
                    {hotel.thumbnail ? (
                      <img
                        src={hotel.thumbnail}
                        alt="Hotel thumbnail"
                        className="w-14 h-10 object-cover rounded"
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  <TableCell>
                    <div
                      className="truncate max-w-[200px]"
                      title={cityName(hotel.cityId)}
                    >
                      {cityName(hotel.cityId)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div
                      className="truncate max-w-[250px]"
                      title={hotel.address_en || ""}
                    >
                      {hotel.address_en || "-"}
                    </div>
                  </TableCell>

                  <TableCell>{hotel?.category?.name_en ?? "-"}</TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onView(hotel)}>
                          <Eye className="h-4 w-4 mr-2" /> Show
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(hotel)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => askDelete(hotel)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

            {/* Empty state (only when not loading) */}
            {!isLoadingData && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                    No hotels found.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={onCloseDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this hotel?</AlertDialogTitle>
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
