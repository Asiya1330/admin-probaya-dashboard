"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type JSX } from "react";
import { toast } from "sonner";

import { deleteProduct } from "@/actions/products.actions";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { FallbackImage } from "@/components/shared/FallbackImage";
import { PageToolbar } from "@/components/shared/PageToolbar";
import { ScoreAllProductsButton } from "@/components/products/ScoreAllProductsButton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaginatedResult } from "@/lib/pagination";
import {
  PRODUCT_FILTER_CATEGORIES,
  type ProductRatingFilter,
} from "@/lib/filters/products-filters";
import type { Product } from "@/types/admin.types";

type ProductsTableProps = {
  result: PaginatedResult<Product>;
  categoryFilter: string;
  ratingFilter: ProductRatingFilter;
};

type DeleteTarget = {
  id: string;
  name: string;
};

const getRatingBadge = (score: number | null): string => {
  if (score === null) return "badge-purple";
  if (score >= 70) return "badge-green";
  if (score >= 40) return "border-amber-500/30 bg-amber-500/15 text-amber-300";
  return "border-red-500/30 bg-red-500/15 text-red-300";
};

const getVerifiedBadge = (verified: boolean | null): string => {
  if (verified) {
    return "badge-green";
  }
  return "border-amber-500/30 bg-amber-500/15 text-amber-300";
};

const getVerifiedLabel = (verified: boolean | null): string =>
  verified ? "Verified" : "Unverified";

export const ProductsTable = ({
  result,
  categoryFilter,
  ratingFilter,
}: ProductsTableProps): JSX.Element => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = (): void => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    startTransition(async (): Promise<void> => {
      const response = await deleteProduct(deleteTarget.id);
      setIsDeleting(false);

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      toast.success("Product deleted");
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 md:p-8">
      <PageToolbar
        total={result.total}
        resourceLabel="Products"
        addHref="/products/new"
        addLabel="Add Product"
        extraActions={<ScoreAllProductsButton />}
        selectFilters={[
          {
            paramKey: "category",
            value: categoryFilter,
            clearValue: "all",
            placeholder: "Category",
            options: [
              { value: "all", label: "All categories" },
              ...PRODUCT_FILTER_CATEGORIES.map((category) => ({
                value: category,
                label: category,
              })),
            ],
          },
          {
            paramKey: "rating",
            value: ratingFilter,
            clearValue: "all",
            placeholder: "Rating",
            options: [
              { value: "all", label: "All ratings" },
              { value: "unscored", label: "Unscored" },
              { value: "excellent", label: "Excellent (70+)" },
              { value: "moderate", label: "Moderate (40–69)" },
              { value: "poor", label: "Poor (<40)" },
            ],
          },
        ]}
      />
        <div className=" rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Preview</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                result.data.map((product) => (
                  <TableRow key={product.id} className="border-border">
                    <TableCell>
                      <div className="relative size-10 overflow-hidden rounded-lg bg-muted">
                        <FallbackImage
                          src={product.image_url}
                          alt={product.product_name ?? "Product"}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="font-medium text-white hover:underline"
                      >
                        {product.product_name ?? "Untitled"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.brand ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {product.barcode ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="badge-purple rounded-full border px-2 py-0.5 text-xs">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${getVerifiedBadge(product.verified)}`}
                      >
                        {getVerifiedLabel(product.verified)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${getRatingBadge(product.score)}`}
                      >
                        {product.score ?? "Unscored"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/products/${product.id}/edit`}>
                            <Pencil className="size-4 text-[#3b82f6]" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isPending}
                          onClick={(): void => {
                            setDeleteTarget({
                              id: product.id,
                              name: product.product_name ?? "this product",
                            });
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      <DataTablePagination
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open): void => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
        title="Delete product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will remove the product and its ingredient associations. Ingredient records will not be deleted.`}
        confirmLabel="Delete product"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
