"use client";

import Link from "next/link";
import { type JSX } from "react";

import { FallbackImage } from "@/components/shared/FallbackImage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FlaggedIngredientProductLink } from "@/types/admin.types";

type AttachedProductsModalProps = {
  ingredientName: string | null;
  products: FlaggedIngredientProductLink[];
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AttachedProductsModal = ({
  ingredientName,
  products,
  isLoading,
  open,
  onOpenChange,
}: AttachedProductsModalProps): JSX.Element => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attached products</DialogTitle>
          <DialogDescription>
            Products affected by {ingredientName ?? "this ingredient"}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <LoadingSpinner className="size-4" />
            Loading products…
          </div>
        ) : products.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No products found for this ingredient.
          </p>
        ) : (
          <ul className="max-h-96 space-y-2 overflow-auto">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}/edit`}
                  className="flex items-center gap-3 rounded-lg border border-border p-2 transition-colors hover:bg-muted/50"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <FallbackImage
                      src={product.image_url}
                      alt={product.product_name ?? "Product"}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {product.product_name ?? "Untitled"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {product.brand ?? "—"}
                      {product.barcode ? ` · ${product.barcode}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};
