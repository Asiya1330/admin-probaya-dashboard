import { Suspense, type JSX } from "react";

import { SubmissionsTable } from "@/components/submissions/SubmissionsTable";
import { parsePageParam } from "@/lib/pagination";
import {
  getSubmissionsPage,
  parseSubmissionCategoryFilter,
  parseSubmissionStatusFilter,
} from "@/lib/submissions";

type SubmissionsPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    category?: string;
  }>;
};

export default async function SubmissionsPage({
  searchParams,
}: SubmissionsPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const statusFilter = parseSubmissionStatusFilter(params.status);
  const categoryFilter = parseSubmissionCategoryFilter(params.category);
  const result = await getSubmissionsPage(
    page,
    params.search,
    statusFilter,
    categoryFilter,
  );

  return (
    <Suspense>
      <SubmissionsTable
        result={result}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
      />
    </Suspense>
  );
}
