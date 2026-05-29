import { Suspense, type JSX } from "react";

import { IngredientsTable } from "@/components/ingredients/IngredientsTable";
import { getIngredientsPage } from "@/lib/ingredients";
import { parsePageParam } from "@/lib/pagination";

type IngredientsPageProps = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function IngredientsPage({
  searchParams,
}: IngredientsPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const result = await getIngredientsPage(page, params.search);

  return (
    <Suspense>
      <IngredientsTable result={result} />
    </Suspense>
  );
}
