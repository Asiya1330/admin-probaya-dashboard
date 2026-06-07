"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { type JSX } from "react";

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
} from "@/lib/filters/flagged-ingredients-filters";
import type { FlaggedIngredient } from "@/types/admin.types";

type FlaggedIngredientsTableProps = {
  result: PaginatedResult<FlaggedIngredient>;
  reviewFilter: FlaggedReviewFilter;
  scoreFilter: FlaggedScoreFilter;
};

export const FlaggedIngredientsTable = ({
  result,
  reviewFilter,
  scoreFilter,
}: FlaggedIngredientsTableProps): JSX.Element => {
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
              <TableHead>Products</TableHead>
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
                    {flagged.product_ids?.length ?? 0}
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
    </div>
  );
};
