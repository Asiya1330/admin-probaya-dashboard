"use client";

import { useRouter } from "next/navigation";
import { useTransition, type JSX } from "react";
import { toast } from "sonner";

import { createProduct, updateProduct } from "@/actions/products.actions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types/admin.types";

type ProductFormProps = {
  product?: Product;
};

export const ProductForm = ({ product }: ProductFormProps): JSX.Element => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      product_name: String(formData.get("product_name") ?? ""),
      brand: String(formData.get("brand") ?? "") || null,
      barcode: String(formData.get("barcode") ?? "") || null,
      category: String(formData.get("category") ?? "General"),
      image_url: String(formData.get("image_url") ?? "") || null,
      ingredients_list: String(formData.get("ingredients_list") ?? "") || null,
    };

    startTransition(async (): Promise<void> => {
      const result = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(product ? "Product updated" : "Product created");
      router.push(`/products/${result.data.id}/edit`);
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product_name">Product Name</Label>
          <Input
            id="product_name"
            name="product_name"
            defaultValue={product?.product_name ?? ""}
            required
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            name="brand"
            defaultValue={product?.brand ?? ""}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input
            id="barcode"
            name="barcode"
            defaultValue={product?.barcode ?? ""}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            defaultValue={product?.category ?? "General"}
            className="bg-background"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          name="image_url"
          defaultValue={product?.image_url ?? ""}
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ingredients_list">
          Ingredients (comma-separated INCI names)
        </Label>
        <textarea
          id="ingredients_list"
          name="ingredients_list"
          defaultValue={product?.ingredients_list ?? ""}
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <LoadingSpinner />
              Saving...
            </>
          ) : product ? (
            "Save Product"
          ) : (
            "Create Product"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={(): void => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
