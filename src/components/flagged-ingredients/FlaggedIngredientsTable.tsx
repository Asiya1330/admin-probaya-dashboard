"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type JSX } from "react";
import { toast } from "sonner";

import { getFlaggedIngredientLinkedProducts } from "@/actions/flagged-ingredients.actions";
import { AttachedProductsModal } from "@/components/flagged-ingredients/AttachedProductsModal";
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
import { formatUserDate } from "@/lib/format";
import type { PaginatedResult } from "@/lib/pagination";
import type {
  FlaggedReviewFilter,
  FlaggedScoreFilter,
  FlaggedSortField,
  FlaggedSortOrder,
} from "@/lib/filters/flagged-ingredients-filters";
import type {
  FlaggedIngredient,
  FlaggedIngredientProductLink,
} from "@/types/admin.types";
import { cn } from "@/lib/utils";

type FlaggedIngredientsTableProps = {
  result: PaginatedResult<FlaggedIngredient>;
  reviewFilter: FlaggedReviewFilter;
  scoreFilter: FlaggedScoreFilter;
  sortField: FlaggedSortField;
  sortOrder: FlaggedSortOrder;
};

type SelectedIngredient = {
  ingredientName: string | null;
};

export const FlaggedIngredientsTable = ({
  result,
  reviewFilter,
  scoreFilter,
  sortField,
  sortOrder,
}: FlaggedIngredientsTableProps): JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedIngredient, setSelectedIngredient] =
    useState<SelectedIngredient | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<
    FlaggedIngredientProductLink[]
  >([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const handleOpenProducts = (flagged: FlaggedIngredient): void => {
    setSelectedIngredient({ ingredientName: flagged.ingredient_name });
    setLinkedProducts([]);
    setIsLoadingProducts(true);

    void getFlaggedIngredientLinkedProducts(flagged.product_ids).then(
      (response) => {
        setIsLoadingProducts(false);
        if (!response.success) {
          toast.error(response.error);
          return;
        }
        setLinkedProducts(response.data);
      },
    );
  };

  const handleCloseProducts = (): void => {
    setSelectedIngredient(null);
    setLinkedProducts([]);
    setIsLoadingProducts(false);
  };

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

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 md:p-8">
      <PageToolbar
        total={result.total}
        resourceLabel="Flagged Ingredients"
        showExport={false}
        extraActions={<SyncNoDataFlaggedButton />}
        selectFilters={[
          {
            paramKey: "review",
            value: reviewFilter,
            clearValue: "all",
            placeholder: "Review status",
            options: [
              { value: "all", label: "All pending" },
              { value: "needs_review", label: "Needs human review" },
              { value: "ready", label: "Ready to approve" },
            ],
          },
          {
            paramKey: "score",
            value: scoreFilter,
            clearValue: "all",
            placeholder: "AI score",
            options: [
              { value: "all", label: "All scores" },
              { value: "scored", label: "AI scored" },
              { value: "unscored", label: "Not yet scored" },
            ],
          },
        ]}
      />

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Ingredients awaiting scoring. Open a flagged ingredient to review details,
        score with AI, and approve.
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Ingredient</TableHead>
              <TableHead>INCI Name</TableHead>
              <TableHead>
                <button
                  type="button"
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1 font-medium transition-colors hover:text-foreground",
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
              <TableHead>Flagged</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No flagged ingredients pending review.
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((flagged) => (
                <TableRow key={flagged.id} className="border-border">
                  <TableCell className="font-medium text-white">
                    <Link
                      href={`/flagged-ingredients/${flagged.id}`}
                      className="hover:text-[#8b5cf6] hover:underline"
                    >
                      {flagged.ingredient_name ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {flagged.inci_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <button
                      type="button"
                      className="cursor-pointer rounded-full px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-[#8b5cf6]/15 hover:text-[#c4b5fd]"
                      onClick={(): void => handleOpenProducts(flagged)}
                    >
                      {flagged.product_ids?.length ?? 0}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatUserDate(flagged.flagged_at)}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                      {flagged.status}
                    </span>
                    {flagged.needs_human_review ? (
                      <span className="ml-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                        Needs review
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link href={`/flagged-ingredients/${flagged.id}`}>
                        <Eye className="size-4 text-[#3b82f6]" />
                        <span className="sr-only">Review flagged ingredient</span>
                      </Link>
                    </Button>
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

      <AttachedProductsModal
        open={selectedIngredient !== null}
        ingredientName={selectedIngredient?.ingredientName ?? null}
        products={linkedProducts}
        isLoading={isLoadingProducts}
        onOpenChange={(open): void => {
          if (!open) {
            handleCloseProducts();
          }
        }}
      />
    </div>
  );
};
