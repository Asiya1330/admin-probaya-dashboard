import { Suspense, type JSX } from "react";

import { UsersTable } from "@/components/users/UsersTable";
import { parsePageParam } from "@/lib/pagination";
import { getUsersPage, parseUserRoleFilter } from "@/lib/users";

type UsersPageProps = {
  searchParams: Promise<{ page?: string; search?: string; role?: string }>;
};

export default async function UsersPage({
  searchParams,
}: UsersPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const roleFilter = parseUserRoleFilter(params.role);
  const result = await getUsersPage(page, params.search, roleFilter);

  return (
    <Suspense>
      <UsersTable result={result} roleFilter={roleFilter} />
    </Suspense>
  );
}
