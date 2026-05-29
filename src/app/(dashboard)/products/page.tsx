import { Suspense, type JSX } from "react";

import { ProductsTable } from "@/components/products/ProductsTable";
import { getProductsPage } from "@/lib/products";
import { parsePageParam } from "@/lib/pagination";

type ProductsPageProps = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const result = await getProductsPage(page, params.search);

  return (
    <Suspense>
      <ProductsTable result={result} />
    </Suspense>
  );
}
