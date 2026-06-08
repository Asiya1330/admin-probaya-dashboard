import { Suspense, type JSX } from "react";

import { IngredientsTable } from "@/components/ingredients/IngredientsTable";
import {
  getIngredientsPage,
  parseIngredientClassificationFilter,
  parseIngredientScoreFilter,
} from "@/lib/ingredients";
import {
  parseIngredientSortField,
  parseIngredientSortOrder,
} from "@/lib/filters/ingredients-filters";
import { parsePageParam } from "@/lib/pagination";

type IngredientsPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    classification?: string;
    score?: string;
    sort?: string;
    order?: string;
  }>;
};

export default async function IngredientsPage({
  searchParams,
}: IngredientsPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const classificationFilter = parseIngredientClassificationFilter(
    params.classification,
  );
  const scoreFilter = parseIngredientScoreFilter(params.score);
  const sortField = parseIngredientSortField(params.sort);
  const sortOrder = parseIngredientSortOrder(params.order);
  const result = await getIngredientsPage(
    page,
    params.search,
    classificationFilter,
    scoreFilter,
    sortField,
    sortOrder,
  );

  return (
    <Suspense>
      <IngredientsTable
        result={result}
        classificationFilter={classificationFilter}
        scoreFilter={scoreFilter}
        sortField={sortField}
        sortOrder={sortOrder}
      />
    </Suspense>
  );
}
