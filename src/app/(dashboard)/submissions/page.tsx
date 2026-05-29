import { Suspense, type JSX } from "react";

import { SubmissionsTable } from "@/components/submissions/SubmissionsTable";
import { parsePageParam } from "@/lib/pagination";
import { getSubmissionsPage } from "@/lib/submissions";

type SubmissionsPageProps = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function SubmissionsPage({
  searchParams,
}: SubmissionsPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const result = await getSubmissionsPage(page, params.search, "pending");

  return (
    <Suspense>
      <SubmissionsTable result={result} />
    </Suspense>
  );
}
