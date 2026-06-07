import { Suspense, type JSX } from "react";

import { ProductsTable } from "@/components/products/ProductsTable";
import {
  getProductsPage,
  parseProductCategoryFilter,
  parseProductRatingFilter,
} from "@/lib/products";
import { parsePageParam } from "@/lib/pagination";

type ProductsPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    rating?: string;
  }>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const categoryFilter = parseProductCategoryFilter(params.category);
  const ratingFilter = parseProductRatingFilter(params.rating);
  const result = await getProductsPage(
    page,
    params.search,
    categoryFilter,
    ratingFilter,
  );

  return (
    <Suspense>
      <ProductsTable
        result={result}
        categoryFilter={categoryFilter}
        ratingFilter={ratingFilter}
      />
    </Suspense>
  );
}
