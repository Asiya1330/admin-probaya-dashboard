"use client";

import { Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import { deleteProduct } from "@/actions/products.actions";
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
import type { Product } from "@/types/admin.types";

type ProductsTableProps = {
  result: PaginatedResult<Product>;
};

const getRatingBadge = (score: number | null): string => {
  if (score === null) return "badge-purple";
  if (score >= 70) return "badge-green";
  if (score >= 40) return "border-amber-500/30 bg-amber-500/15 text-amber-300";
  return "border-red-500/30 bg-red-500/15 text-red-300";
};

export const ProductsTable = ({ result }: ProductsTableProps): JSX.Element => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (productId: string): Promise<void> => {
    setDeletingId(productId);
    const response = await deleteProduct(productId);
    setDeletingId(null);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    toast.success("Product deleted");
    router.refresh();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 md:p-8">
      <PageToolbar
        total={result.total}
        resourceLabel="Products"
        addHref="/products/new"
        addLabel="Add Product"
      />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Preview</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((product) => (
                <TableRow key={product.id} className="border-border">
                  <TableCell>
                    <div className="relative size-10 overflow-hidden rounded-lg bg-muted">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.product_name ?? "Product"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                          N/A
                        </div>
                      )}
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
                  <TableCell>
                    <span className="badge-purple rounded-full border px-2 py-0.5 text-xs">
                      {product.category}
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
                        disabled={deletingId === product.id}
                        onClick={(): void => {
                          void handleDelete(product.id);
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
