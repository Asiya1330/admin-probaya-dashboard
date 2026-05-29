import { notFound } from "next/navigation";
import { type JSX } from "react";

import { ProductForm } from "@/components/products/ProductForm";
import { ProductScoringPanel } from "@/components/scoring/ProductScoringPanel";
import { getProductById, getProductIngredientStatuses } from "@/lib/products";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const [product, statuses] = await Promise.all([
    getProductById(id),
    getProductIngredientStatuses(id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-8 overflow-auto p-4 md:p-8">
      <div>
        <h2 className="mb-6 text-xl font-semibold text-white">Edit Product</h2>
        <ProductForm product={product} />
      </div>
      <ProductScoringPanel
        productId={product.id}
        initialStatuses={statuses}
        currentScore={product.score}
      />
    </div>
  );
}
