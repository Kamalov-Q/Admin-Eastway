"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import type { Tour } from "@/api/tours";
import { ExternalLink, X } from "lucide-react";

type Props = {
  data: Tour[];
  onEdit: (tour: Tour) => void;
  // can be sync or async
  onDelete: (id: number) => void | Promise<void>;
};

export function ToursTable({ data, onEdit, onDelete }: Props) {
  // Image preview modal
  const [imageOpen, setImageOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Delete confirmation modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Tour | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openImage = (url: string) => {
    setModalImage(url);
    setImageOpen(true);
  };

  const closeImage = () => {
    setImageOpen(false);
    setModalImage(null);
  };

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
      // keep dialog open if deletion failed
      setDeleting(false);
      console.error("Failed to delete tour:", e);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title (EN)</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Thumbnail</TableHead>
            <TableHead>First Image</TableHead>
            <TableHead>YouTube</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((tour) => (
            <TableRow key={tour.id}>
              <TableCell>{tour.id}</TableCell>
              <TableCell>{tour.title_en}</TableCell>
              <TableCell>{tour.days || "-"}</TableCell>
              <TableCell>{tour.type || "-"}</TableCell>
              <TableCell>{tour.cityId || "-"}</TableCell>
              <TableCell>
                {tour.thumbnail ? (
                  <img
                    src={tour.thumbnail}
                    alt="Thumbnail"
                    className="w-16 h-12 object-cover rounded cursor-pointer"
                    onClick={() => openImage(tour.thumbnail!)}
                  />
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                {tour.images && tour.images[0]?.url ? (
                  <img
                    src={tour.images[0].url}
                    alt="First Image"
                    className="w-16 h-12 object-cover rounded cursor-pointer"
                    onClick={() => openImage(tour.images![0].url)}
                  />
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                {tour.youtubeLink ? (
                  <a href={tour.youtubeLink} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-5 h-5 text-blue-500" />
                  </a>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(tour)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => askDelete(tour)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Image Modal */}
      <Dialog open={imageOpen} onOpenChange={closeImage}>
        <DialogContent className="p-0 bg-black max-w-3xl max-h-[90vh] flex justify-center items-center relative">
          {modalImage && (
            <>
              <img
                src={modalImage}
                alt="Preview"
                className="max-h-[90vh] object-contain"
              />
              <Button
                variant="ghost"
                className="absolute top-2 right-2 text-white"
                onClick={closeImage}
              >
                <X />
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
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
