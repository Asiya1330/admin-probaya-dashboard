import { type JSX } from "react";

import { ProductForm } from "@/components/products/ProductForm";

export default function NewProductPage(): JSX.Element {
  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">Add Product</h2>
      <ProductForm />
    </div>
  );
}
