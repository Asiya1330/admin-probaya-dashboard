import { Suspense, type JSX } from "react";

import { FlaggedIngredientsTable } from "@/components/flagged-ingredients/FlaggedIngredientsTable";
import {
  getFlaggedIngredientsPage,
  parseFlaggedReviewFilter,
  parseFlaggedScoreFilter,
  parseFlaggedSortField,
  parseFlaggedSortOrder,
} from "@/lib/flagged-ingredients";
import { parsePageParam } from "@/lib/pagination";

type FlaggedIngredientsPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    review?: string;
    score?: string;
    sort?: string;
    order?: string;
  }>;
};

export default async function FlaggedIngredientsPage({
  searchParams,
}: FlaggedIngredientsPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const reviewFilter = parseFlaggedReviewFilter(params.review);
  const scoreFilter = parseFlaggedScoreFilter(params.score);
  const sortField = parseFlaggedSortField(params.sort);
  const sortOrder = parseFlaggedSortOrder(params.order);
  const result = await getFlaggedIngredientsPage(
    page,
    params.search,
    reviewFilter,
    scoreFilter,
    sortField,
    sortOrder,
  );

  return (
    <Suspense>
      <FlaggedIngredientsTable
        result={result}
        reviewFilter={reviewFilter}
        scoreFilter={scoreFilter}
        sortField={sortField}
        sortOrder={sortOrder}
      />
    </Suspense>
  );
}
