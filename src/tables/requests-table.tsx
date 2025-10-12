"use client";

import { useEffect, useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Eye, MoreHorizontal, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import type { Request } from "@/api/requests";

type Props = {
  data: Request[];
  onView: (r: Request) => void;
  onOpenStatus: (r: Request) => void;
  onDelete?: (id: number) => Promise<unknown> | void;
  isLoadingData?: boolean;
  isErrorData?: boolean;
  errorMessage?: string;
};

const StatusBadge = ({ status }: { status: Request["status"] }) => {
  const map: Record<Request["status"], { label: string; cls: string }> = {
    active: {
      label: "Active",
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    passive: {
      label: "Passive",
      cls: "bg-gray-100 text-gray-700 border-gray-200",
    },
  };
  return (
    <Badge className={`border ${map[status].cls}`}>{map[status].label}</Badge>
  );
};

const targetLabel = (r: Request) => {
  if (r.type === "tour" || r.tourId)
    return r.tour?.title_en
      ? `Tour: ${r.tour.title_en}`
      : r.tourId
      ? `Tour #${r.tourId}`
      : "-";
  if (r.type === "hotel" || r.hotelId)
    return r.hotel?.name_en
      ? `Hotel: ${r.hotel.name_en}`
      : r.hotelId
      ? `Hotel #${r.hotelId}`
      : "-";
  return "-";
};

export function RequestsTable({
  data,
  onView,
  onOpenStatus,
  onDelete,
  isLoadingData,
  isErrorData,
  errorMessage,
}: Props) {
  const errOnce = useRef(false);
  useEffect(() => {
    if (isErrorData && !errOnce.current) {
      errOnce.current = true;
      toast.error(errorMessage || "Failed to load requests.");
    }
  }, [isErrorData, errorMessage]);

  // delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState<Request | null>(null);
  const [deleting, setDeleting] = useState(false);

  const onCloseDelete = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) setPending(null);
  };
  const confirmDelete = async () => {
    if (!onDelete || !pending) return;
    setDeleting(true);
    try {
      await toast.promise(Promise.resolve(onDelete(pending.id)), {
        loading: "Deleting request…",
        success: "Request deleted",
        error: "Failed to delete request",
      });
      setDeleteOpen(false);
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
        <Skeleton className="h-5 w-[180px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[220px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[140px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[90px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-[220px]" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 ml-auto rounded" />
      </TableCell>
    </TableRow>
  );

  return (
    <div className="relative rounded-xl bg-white p-2">
      {isLoadingData && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                className="stroke-gray-400"
                fill="none"
                strokeWidth="4"
              />
            </svg>
            Loading…
          </div>
        </div>
      )}

      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">ID</TableHead>
            <TableHead className="w-[180px]">Name</TableHead>
            <TableHead className="w-[220px]">Contact</TableHead>
            <TableHead className="w-[140px]">Citizenship</TableHead>
            <TableHead className="w-[90px]">Travelers</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[220px]">Target</TableHead>
            <TableHead className="text-right w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoadingData &&
            Array.from({ length: 6 }).map((_, i) => <LoadingRow key={i} />)}

          {!isLoadingData &&
            data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>
                  <div
                    className="truncate max-w-[180px]"
                    title={`${r.firstName ?? ""} ${r.lastName ?? ""}`.trim()}
                  >
                    {r.firstName || r.lastName
                      ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim()
                      : "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className="truncate max-w-[220px]"
                    title={`${r.email ?? ""}${r.phone ? ` • ${r.phone}` : ""}`}
                  >
                    {r.email || r.phone
                      ? `${r.email ?? ""}${r.phone ? ` • ${r.phone}` : ""}`
                      : "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className="truncate max-w-[140px]"
                    title={r.citizenship || ""}
                  >
                    {r.citizenship || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  {typeof r.travelers === "number" ? r.travelers : "-"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell>
                  <div
                    className="truncate max-w-[220px]"
                    title={targetLabel(r)}
                  >
                    {targetLabel(r)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onView(r)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenStatus(r)}>
                        <Edit3 className="h-4 w-4 mr-2" /> Update status…
                      </DropdownMenuItem>
                      {onDelete && (
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => {
                            setPending(r);
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

          {!isLoadingData && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="flex justify-center py-10 text-sm text-gray-500">
                  No requests found.
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={onCloseDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this request?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending ? (
                <>
                  You are about to delete request <b>#{pending.id}</b> from{" "}
                  <i>
                    {pending.firstName} {pending.lastName}
                  </i>
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
