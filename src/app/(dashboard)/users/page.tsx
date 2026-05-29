import { Suspense, type JSX } from "react";

import { UsersTable } from "@/components/users/UsersTable";
import { parsePageParam } from "@/lib/pagination";
import { getUsersPage } from "@/lib/users";

type UsersPageProps = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function UsersPage({
  searchParams,
}: UsersPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const result = await getUsersPage(page, params.search);

  return (
    <Suspense>
      <UsersTable result={result} />
    </Suspense>
  );
}
