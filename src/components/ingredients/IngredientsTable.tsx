"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import { deleteIngredient } from "@/actions/ingredients.actions";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { PageToolbar } from "@/components/shared/PageToolbar";
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
import type { Ingredient } from "@/types/admin.types";

type IngredientsTableProps = {
  result: PaginatedResult<Ingredient>;
};

const getClassificationClass = (classification: string | null): string => {
  if (classification === "Beneficial") return "badge-green";
  if (classification === "Harmful") return "border-red-500/30 bg-red-500/15 text-red-300";
  if (classification === "Neutral") return "badge-blue";
  return "badge-purple";
};

export const IngredientsTable = ({
  result,
}: IngredientsTableProps): JSX.Element => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (ingredientId: string): Promise<void> => {
    setDeletingId(ingredientId);
    const response = await deleteIngredient(ingredientId);
    setDeletingId(null);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    toast.success("Ingredient deleted");
    router.refresh();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 md:p-8">
      <PageToolbar
        total={result.total}
        resourceLabel="Ingredients"
        addHref="/ingredients/new"
        addLabel="Add Ingredient"
      />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>INCI Name</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
                  <TableCell>{ingredient.impact_score ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${getClassificationClass(ingredient.classification)}`}
                    >
                      {ingredient.classification ?? "Unscored"}
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
                        disabled={deletingId === ingredient.ingredient_id}
                        onClick={(): void => {
                          void handleDelete(ingredient.ingredient_id);
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
    </div>
  );
};
