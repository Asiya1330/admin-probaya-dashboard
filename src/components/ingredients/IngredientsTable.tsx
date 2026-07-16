"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type JSX } from "react";
import { toast } from "sonner";

import {
  deleteIngredient,
  getIngredientAssociatedProducts,
} from "@/actions/ingredients.actions";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { PageToolbar } from "@/components/shared/PageToolbar";
import { SyncNoDataFlaggedButton } from "@/components/flagged-ingredients/SyncNoDataFlaggedButton";
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
import type {
  IngredientClassificationFilter,
  IngredientScoreFilter,
  IngredientSortField,
  IngredientSortOrder,
} from "@/lib/filters/ingredients-filters";
import type {
  IngredientAssociatedProduct,
  IngredientWithProductCount,
} from "@/types/admin.types";
import { cn } from "@/lib/utils";

type IngredientsTableProps = {
  result: PaginatedResult<IngredientWithProductCount>;
  classificationFilter: IngredientClassificationFilter;
  scoreFilter: IngredientScoreFilter;
  sortField: IngredientSortField;
  sortOrder: IngredientSortOrder;
};

type DeleteTarget = {
  id: string;
  name: string;
};

const getClassificationClass = (classification: string | null): string => {
  if (classification === "Strongly Beneficial" || classification === "Beneficial") {
    return "badge-green";
  }
  if (classification === "Strongly Harmful" || classification === "Harmful") {
    return "border-red-500/30 bg-red-500/15 text-red-300";
  }
  if (classification === "Neutral") return "badge-blue";
  return "badge-purple";
};

const getClassificationLabel = (
  classification: string | null,
  impactScore: string | null,
): string => {
  if (!impactScore || classification === "No Data" || !classification) {
    return "Unscored";
  }
  return classification;
};

export const IngredientsTable = ({
  result,
  classificationFilter,
  scoreFilter,
  sortField,
  sortOrder,
}: IngredientsTableProps): JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [associatedProducts, setAssociatedProducts] = useState<
    IngredientAssociatedProduct[]
  >([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSortProducts = (): void => {
    const params = new URLSearchParams(searchParams.toString());
    const nextOrder =
      sortField === "products" && sortOrder === "desc" ? "asc" : "desc";

    params.set("sort", "products");
    params.set("order", nextOrder);
    params.set("page", "1");

    startTransition((): void => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const productsSortIcon =
    sortField === "products" ? (
      sortOrder === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUp className="size-3.5" />
      )
    ) : (
      <ArrowUpDown className="size-3.5 opacity-50" />
    );

  const handleOpenDelete = (ingredient: IngredientWithProductCount): void => {
    setDeleteTarget({
      id: ingredient.ingredient_id,
      name: ingredient.ingredient_name,
    });
    setAssociatedProducts([]);
    setIsLoadingProducts(true);

    void getIngredientAssociatedProducts(ingredient.ingredient_id).then(
      (response) => {
        setIsLoadingProducts(false);
        if (!response.success) {
          toast.error(response.error);
          return;
        }
        setAssociatedProducts(response.data);
      },
    );
  };

  const handleCloseDelete = (): void => {
    setDeleteTarget(null);
    setAssociatedProducts([]);
    setIsLoadingProducts(false);
  };

  const handleConfirmDelete = (): void => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    startTransition(async (): Promise<void> => {
      const response = await deleteIngredient(deleteTarget.id);
      setIsDeleting(false);

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      toast.success("Ingredient deleted");
      handleCloseDelete();
      router.refresh();
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 md:p-8">
      <PageToolbar
        total={result.total}
        resourceLabel="Ingredients"
        addHref="/ingredients/new"
        addLabel="Add Ingredient"
        extraActions={<SyncNoDataFlaggedButton />}
        selectFilters={[
          {
            paramKey: "classification",
            value: classificationFilter,
            clearValue: "all",
            placeholder: "Classification",
            options: [
              { value: "all", label: "All classifications" },
              { value: "Strongly Beneficial", label: "Strongly Beneficial" },
              { value: "Beneficial", label: "Beneficial" },
              { value: "Neutral", label: "Neutral" },
              { value: "Harmful", label: "Harmful" },
              { value: "Strongly Harmful", label: "Strongly Harmful" },
              { value: "unscored", label: "Unscored (No Data)" },
            ],
          },
          {
            paramKey: "score",
            value: scoreFilter,
            clearValue: "all",
            placeholder: "Score status",
            options: [
              { value: "all", label: "All scores" },
              { value: "scored", label: "Scored" },
              { value: "unscored", label: "Unscored" },
            ],
          },
        ]}
      />
        <div className=" rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>INCI Name</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
                      sortField === "products"
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                    disabled={isPending}
                    onClick={handleSortProducts}
                  >
                    Products
                    {productsSortIcon}
                  </button>
                </TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No ingredients found.
                  </TableCell>
                </TableRow>
              ) : (
                result.data.map((ingredient) => (
                  <TableRow key={ingredient.ingredient_id} className="border-border">
                    <TableCell className="font-medium text-white">
                      {ingredient.ingredient_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ingredient.inci_name}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex min-w-8 justify-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          ingredient.product_count > 0
                            ? "border-[#8b5cf6]/40 bg-[#8b5cf6]/15 text-[#c4b5fd]"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {ingredient.product_count}
                      </span>
                    </TableCell>
                    <TableCell>{ingredient.impact_score ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${getClassificationClass(ingredient.classification)}`}
                      >
                        {getClassificationLabel(
                          ingredient.classification,
                          ingredient.impact_score,
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/ingredients/${ingredient.ingredient_id}/edit`}>
                            <Pencil className="size-4 text-[#3b82f6]" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isPending}
                          onClick={(): void => handleOpenDelete(ingredient)}
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
        isLoadingProducts={isLoadingProducts}
        onOpenChange={(open): void => {
          if (!open && !isDeleting) {
            handleCloseDelete();
          }
        }}
        title="Delete ingredient"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete ingredient"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      >
        {isLoadingProducts ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner className="size-4" />
            Loading associated products…
          </div>
        ) : associatedProducts.length > 0 ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-sm font-medium text-amber-100">
              Used in {associatedProducts.length} product
              {associatedProducts.length === 1 ? "" : "s"}:
            </p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-sm">
              {associatedProducts.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="text-[#8b5cf6] hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {product.product_name ?? "Untitled"}
                    {product.brand ? (
                      <span className="text-muted-foreground"> · {product.brand}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : deleteTarget ? (
          <p className="text-sm text-muted-foreground">
            This ingredient is not linked to any products.
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
};
