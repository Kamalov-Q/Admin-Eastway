"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import {
  useTourCategories,
  useCreateTourCategory,
  useUpdateTourCategory,
  useDeleteTourCategory,
  type Category,
} from "@/api/tour-category";
import { TourCategoryFormModal } from "@/components/forms/tour-category-form";
import { TourCategoryTable } from "@/components/tables/tour-category-table";

export default function TourCategoriesPage() {
  // Pagination state
  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(10);

  const { data, isLoading, isFetching, isError, error } =
    useTourCategories?.() ?? useTourCategories();

  // Normalize response
  const normalize = React.useMemo(() => {
    // Server shape: { data, total, page, limit, totalPages }
    if (data && typeof data === "object" && "data" in (data as any)) {
      const raw = data as any;
      const items: Category[] = Array.isArray(raw.data) ? raw.data : [];
      const total: number = Number(raw.total ?? items.length);
      const currentPage: number = Number(raw.page ?? page);
      const effectiveLimit: number = Number(raw.limit ?? limit);
      const totalPages: number =
        Number(raw.totalPages) ||
        Math.max(1, Math.ceil(total / (effectiveLimit || 1)));
      return {
        items,
        total,
        currentPage,
        effectiveLimit,
        totalPages,
        server: true,
      };
    }

    // Array shape: client-side paginate
    const all: Category[] = Array.isArray(data) ? (data as Category[]) : [];
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / (limit || 1)));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * limit;
    const end = start + limit;
    const items = all.slice(start, end);
    return {
      items,
      total,
      currentPage,
      effectiveLimit: limit,
      totalPages,
      server: false,
    };
  }, [data, page, limit]);

  const { items, total, currentPage, effectiveLimit, totalPages } = normalize;

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  // CRUD hooks
  const create = useCreateTourCategory();
  const update = useUpdateTourCategory();
  const remove = useDeleteTourCategory();

  // Modal state
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit" | "view">("create");
  const [selected, setSelected] = React.useState<Category | null>(null);

  const openCreate = () => {
    setSelected(null);
    setMode("create");
    setOpen(true);
  };
  const openEdit = (c: Category) => {
    setSelected(c);
    setMode("edit");
    setOpen(true);
  };
  const openView = (c: Category) => {
    setSelected(c);
    setMode("view");
    setOpen(true);
  };

  const handleSubmit = async (vals: Partial<Category>) => {
    if (mode === "edit" && selected) {
      await toast.promise(
        update.mutateAsync({ id: selected.id, payload: vals }),
        {
          loading: "Updating…",
          success: "Category updated",
          error: (e) => (e as any)?.message || "Failed to update",
        }
      );
    } else {
      await toast.promise(create.mutateAsync(vals as Omit<Category, "id">), {
        loading: "Creating…",
        success: "Category created",
        error: (e) => (e as any)?.message || "Failed to create",
      });
    }
    setOpen(false);
    setSelected(null);
  };

  const handleDelete = async (id: number) => {
    await toast.promise(remove.mutateAsync(id), {
      loading: "Deleting…",
      success: "Category deleted",
      error: (e) => (e as any)?.message || "Failed to delete",
    });

    // If we deleted the last item on this page and there are previous pages, go back a page
    const remaining = (items?.length ?? 1) - 1;
    if (remaining <= 0 && currentPage > 1) {
      setPage((p) => Math.max(1, p - 1));
    }
  };

  // First-load skeleton
  if (!data && isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-7 w-56 bg-gray-200 rounded" />
        <div className="relative rounded-xl border bg-white p-2">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading categories…
            </div>
          </div>
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError)
    return (
      <div className="p-6 text-red-600">Error: {(error as any)?.message}</div>
    );

  // Range display
  const startIndex = total === 0 ? 0 : (currentPage - 1) * effectiveLimit + 1;
  const endIndex = Math.min(total, currentPage * effectiveLimit);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Tour Categories</h1>
        <Button onClick={openCreate}>+ Add Category</Button>
      </div>

      {/* Page + rows controls (top, similar to Tours/Reviews) */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          Page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rows</label>
          <select
            className="border rounded-md py-2 px-2 text-sm"
            value={effectiveLimit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={!canPrev || isFetching}
              onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!canNext || isFetching}
              onClick={() => canNext && setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <div className="relative rounded-xl border bg-white p-2">
        {isFetching && items.length > 0 && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </div>
          </div>
        )}

        <TourCategoryTable
          data={items}
          onView={openView}
          onEdit={openEdit}
          onDelete={(id) => handleDelete(id)}
          isLoadingData={isFetching || isLoading}
          isErrorData={isError}
          errorMessage={(error as any)?.message}
        />
      </div>

      {/* Footer: range + pagination (same pattern as Tours/Reviews) */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {total > 0 ? (
            <>
              Showing <span className="font-medium">{startIndex}</span>–
              <span className="font-medium">{endIndex}</span> of{" "}
              <span className="font-medium">{total}</span>
            </>
          ) : (
            <>No categories found</>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!canPrev || isFetching}
            onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!canNext || isFetching}
            onClick={() => canNext && setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <TourCategoryFormModal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setSelected(null);
        }}
        initialData={selected ?? undefined}
        onSubmit={handleSubmit}
        mode={mode}
      />
    </div>
  );
}
