import { type JSX } from "react";

import { ProductWizard } from "@/components/products/wizard/ProductWizard";

export default function NewProductPage(): JSX.Element {
  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <ProductWizard />
    </div>
  );
}
