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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Category } from "@/api/tour-category";

type Props = {
  data: Category[];
  onView: (c: Category) => void;
  onEdit: (c: Category) => void;
  onDelete: (id: number) => void | Promise<void>;
  isLoadingData?: boolean;
  isErrorData?: boolean;
  errorMessage?: string;
};

export function HotelCategoryTable({
  data,
  onView,
  onEdit,
  onDelete,
  isLoadingData,
  isErrorData,
  errorMessage,
}: Props) {
  const notified = React.useRef(false);
  React.useEffect(() => {
    if (isErrorData && !notified.current) {
      notified.current = true;
      toast.error(errorMessage || "Failed to load categories.");
    }
  }, [isErrorData, errorMessage]);

  const [delOpen, setDelOpen] = React.useState(false);
  const [pending, setPending] = React.useState<Category | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const askDelete = (c: Category) => {
    setPending(c);
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
        success: "Deleted",
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
      {Array.from({ length: 4 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      ))}
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 ml-auto rounded" />
      </TableCell>
    </TableRow>
  );

  return (
    <div className="relative rounded-xl bg-white p-2">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead className="w-[240px]">Name (EN)</TableHead>
            <TableHead className="w-[240px]">Name (RU)</TableHead>
            <TableHead className="w-[240px]">Name (ES)</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoadingData &&
            Array.from({ length: 6 }).map((_, i) => <LoadingRow key={i} />)}

          {!isLoadingData &&
            data.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell className="truncate max-w-[240px]" title={c.name_en}>
                  {c.name_en || "-"}
                </TableCell>
                <TableCell className="truncate max-w-[240px]" title={c.name_ru}>
                  {c.name_ru || "-"}
                </TableCell>
                <TableCell className="truncate max-w-[240px]" title={c.name_es}>
                  {c.name_es || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onView(c)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(c)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => askDelete(c)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

          {!isLoadingData && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <div className="py-10 text-center text-sm text-gray-500">
                  No categories found.
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
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending ? (
                <>
                  You are about to delete <b>#{pending.id}</b>{" "}
                  {pending.name_en ? (
                    <>
                      (<i>{pending.name_en}</i>)
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
    </div>
  );
}
