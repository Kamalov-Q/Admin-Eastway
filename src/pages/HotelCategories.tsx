"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import {
  useHotelCategories,
  useCreateHotelCategory,
  useUpdateHotelCategory,
  useDeleteHotelCategory,
  type Category,
} from "@/api/hotel-category";
import { HotelCategoryFormModal } from "@/components/forms/hotel-category-form";
import { HotelCategoryTable } from "@/components/tables/hotel-category-table";

export default function HotelCategoriesPage() {
  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(10);

  const {
    data: pageData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useHotelCategories({
    page,
    limit,
  });

  const create = useCreateHotelCategory();
  const update = useUpdateHotelCategory();
  const remove = useDeleteHotelCategory();

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit" | "view">("create");
  const [selected, setSelected] = React.useState<Category | null>(null);

  // Extract pagination data from new structure (MUST BE BEFORE EARLY RETURNS)
  const paginationData = React.useMemo(() => {
    let items: Category[] = [];
    let total = 0;
    let totalPages = 1;
    let currentPage = page;
    let hasNextPage = false;
    let hasPrevPage = false;

    if (pageData) {
      // New structure: { data: Category[], meta: { ... } }
      items = pageData.data ?? [];
      const meta = pageData.meta;

      if (meta) {
        total = meta.total ?? 0;
        totalPages = meta.totalPages ?? 1;
        currentPage = meta.page ?? page;
        hasNextPage = meta.hasNextPage ?? false;
        hasPrevPage = meta.hasPrevPage ?? false;
      }
    }

    return { items, total, totalPages, currentPage, hasNextPage, hasPrevPage };
  }, [pageData, page]);

  const { items, total, totalPages, currentPage, hasNextPage, hasPrevPage } =
    paginationData;

  const canPrev = hasPrevPage || currentPage > 1;
  const canNext = hasNextPage || currentPage < totalPages;

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

    const remaining = (items?.length ?? 1) - 1;
    if (remaining <= 0 && currentPage > 1) {
      setPage((p) => Math.max(1, p - 1));
    }
  };

  // Calculate range for display
  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(total, currentPage * limit);

  // First-load skeleton (AFTER all hooks)
  if (!pageData && isLoading) {
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

  if (isError) {
    return (
      <div className="p-6 text-red-600">Error: {(error as any)?.message}</div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Hotel Categories</h1>
        <Button onClick={openCreate}>+ Add Category</Button>
      </div>

      <div className="mb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        {/* Rows */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Rows</label>
          <select
            className="border rounded-md py-2 px-2 text-sm"
            value={limit}
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

        <HotelCategoryTable
          data={items}
          onView={openView}
          onEdit={openEdit}
          onDelete={(id) => handleDelete(id)}
          isLoadingData={isFetching || isLoading}
          isErrorData={isError}
          errorMessage={(error as any)?.message}
        />
      </div>

      {/* Footer: range + pagination */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          {total > 0 ? (
            <>
              Showing <span className="font-medium">{startIndex}</span>–
              <span className="font-medium">{endIndex}</span> of{" "}
              <span className="font-medium">{total}</span>
            </>
          ) : (
            <>No cities found</>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
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
      </div>

      <HotelCategoryFormModal
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
