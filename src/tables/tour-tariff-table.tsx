"use client";

import * as React from "react";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import type { Tour } from "@/api/tours";
import { useTours } from "@/api/tours";
import type { TourTariff } from "@/api/tour-tariff";

type Props = {
  data: TourTariff[];
  onView: (t: TourTariff) => void;
  onEdit: (t: TourTariff) => void;
  onDelete: (id: number) => void | Promise<void>;
  isLoadingData?: boolean;
  isErrorData?: boolean;
  errorMessage?: string;
};

export function TourTariffTable({
  data,
  onView,
  onEdit,
  onDelete,
  isLoadingData,
  isErrorData,
  errorMessage,
}: Props) {
  // notify errors once
  const notified = React.useRef(false);
  React.useEffect(() => {
    if (isErrorData && !notified.current) {
      notified.current = true;
      toast.error(errorMessage || "Failed to load tariffs.");
    }
  }, [isErrorData, errorMessage]);

  // Load tours for fallback name resolution
  const toursQuery = useTours({ limit: 1000 });
  const tours: Tour[] = React.useMemo(() => {
    const raw = toursQuery.data as any;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.data ?? [];
  }, [toursQuery.data]);

  const tourName = (id: number) => {
    const t = tours.find((x) => Number(x.id) === Number(id));
    return (t as any)?.title_en || (t as any)?.title_ru || `#${id}`;
    // fallback: #<id> if nothing else
  };

  // delete dialog
  const [delOpen, setDelOpen] = React.useState(false);
  const [pending, setPending] = React.useState<TourTariff | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const askDelete = (t: TourTariff) => {
    setPending(t);
    setDelOpen(true);
  };
  const closeDelete = (open: boolean) => {
    setDelOpen(open);
    if (!open) setPending(null);
  };
  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await toast.promise(Promise.resolve(onDelete(pending.id)), {
        loading: "Deleting…",
        success: "Tariff deleted",
        error: "Failed to delete",
      });
      setDelOpen(false);
      setPending(null);
    } finally {
      setDeleting(false);
    }
  };

  const LoadingRow = () => (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5 w-10" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[220px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[360px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[120px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[200px]" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 ml-auto rounded" />
      </TableCell>
    </TableRow>
  );

  // Helper to resolve attached tour titles for each tariff row
  const getAttachedTitles = (t: TourTariff): string[] => {
    // Your GET shape: t.tours = [{ id, tourId, tariffId, tour: { title_en? } }]
    const links =
      (((t as any).tours as Array<{
        tourId: number;
        tour?: { title_en?: string; title_ru?: string };
      }>) ??
        []) ||
      [];

    return links.map((link) => {
      const titleFromRel = link?.tour?.title_en || link?.tour?.title_ru;
      if (titleFromRel) return titleFromRel;
      // fallback to global tours list if relation title not present
      return tourName(Number(link?.tourId));
    });
  };

  return (
    <div className="relative rounded-xl bg-white p-2">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">ID</TableHead>
            <TableHead className="w-[220px]">Name</TableHead>
            <TableHead className="w-[360px]">Description</TableHead>
            <TableHead className="w-[120px]">Prices</TableHead>
            <TableHead className="w-[260px]">Attached Tours</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoadingData &&
            Array.from({ length: 6 }).map((_, i) => <LoadingRow key={i} />)}

          {!isLoadingData &&
            data.map((t) => {
              const titles = getAttachedTitles(t);
              const first = titles.slice(0, 3);
              const restCount = Math.max(0, titles.length - first.length);

              return (
                <TableRow key={t.id}>
                  <TableCell>{t.id}</TableCell>

                  <TableCell className="truncate max-w-[220px]" title={t.name}>
                    {t.name}
                  </TableCell>

                  <TableCell
                    className="truncate max-w-[360px]"
                    title={t.description || ""}
                  >
                    {t.description || "-"}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(t.priceEntries ?? [])
                        .slice(0, 3)
                        .map((p: any, idx: number) => (
                          <Badge key={`${p.person}-${idx}`} variant="secondary">
                            {p.person}p: {p.amount}
                          </Badge>
                        ))}
                      {(t.priceEntries?.length ?? 0) > 3 && (
                        <Badge variant="outline">
                          +{(t.priceEntries?.length ?? 0) - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell title={titles.join(", ")}>
                    <div className="flex flex-wrap gap-1">
                      {first.map((title, i) => (
                        <Badge key={`${t.id}-title-${i}`} variant="secondary">
                          {title}
                        </Badge>
                      ))}
                      {restCount > 0 && (
                        <Badge variant="outline">+{restCount} more</Badge>
                      )}
                      {titles.length === 0 && <span>-</span>}
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
                        <DropdownMenuItem onClick={() => onView(t)}>
                          <Eye className="h-4 w-4 mr-2" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(t)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => askDelete(t)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}

          {!isLoadingData && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex justify-center py-10 text-sm text-gray-500">
                  No tour tariffs found.
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete confirm */}
      <AlertDialog open={delOpen} onOpenChange={closeDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tariff?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending ? (
                <>
                  You are about to delete <b>#{pending.id}</b> (
                  <i>{pending.name}</i>). This action cannot be undone.
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
    </div>
  );
}
