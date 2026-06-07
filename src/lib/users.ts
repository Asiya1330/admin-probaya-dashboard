import "server-only";

import {
  buildPaginatedResult,
  getRange,
  type PaginatedResult,
} from "@/lib/pagination";
import type { UserRole, UserWithProfile } from "@/types/database.types";
import type { UserRoleFilter } from "@/lib/filters/users-filters";

export type RequireAdminResult =
  | { authorized: true; userId: string }
  | { authorized: false; error: string };

export const requireAdmin = async (): Promise<RequireAdminResult> => {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false, error: "Unauthorized" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { authorized: false, error: "Forbidden: admin access required" };
  }

  return { authorized: true, userId: user.id };
};

export type { UserRoleFilter } from "@/lib/filters/users-filters";
export { USER_ROLE_FILTERS, parseUserRoleFilter } from "@/lib/filters/users-filters";

export const getUsersPage = async (
  page: number,
  search?: string,
  roleFilter: UserRoleFilter = "all",
): Promise<PaginatedResult<UserWithProfile>> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: authData, error: authError } =
    await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (authError) {
    throw new Error(authError.message);
  }

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, role");

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.role as UserRole]),
  );

  let users: UserWithProfile[] = (authData.users ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? "Unknown",
    created_at: user.created_at,
    role: profileMap.get(user.id) ?? "user",
  }));

  if (roleFilter !== "all") {
    users = users.filter((user) => user.role === roleFilter);
  }

  if (search) {
    const term = search.toLowerCase();
    users = users.filter((user) => user.email.toLowerCase().includes(term));
  }

  const { from, to } = getRange(page);
  const paginated = users.slice(from, to + 1);

  return buildPaginatedResult(paginated, users.length, page);
};

export const getUserById = async (
  userId: string,
): Promise<UserWithProfile | null> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return null;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return {
    id: data.user.id,
    email: data.user.email ?? "Unknown",
    created_at: data.user.created_at,
    role: (profile?.role as UserRole) ?? "user",
  };
};

export const getDashboardStats = async (): Promise<{
  totalUsers: number;
  totalAdmins: number;
  totalRegularUsers: number;
  newUsersThisMonth: number;
  totalProducts: number;
  totalIngredients: number;
  pendingSubmissions: number;
}> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const [
    usersResult,
    profilesResult,
    productsResult,
    ingredientsResult,
    submissionsResult,
  ] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("profiles").select("role"),
    admin.from("products").select("*", { count: "exact", head: true }),
    admin.from("ingredients").select("*", { count: "exact", head: true }),
    admin
      .from("product_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const profiles = profilesResult.data ?? [];
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const authUsers = usersResult.data;
  const users = authUsers.users ?? [];

  const newUsersThisMonth = users.filter(
    (user) => new Date(user.created_at) >= startOfMonth,
  ).length;

  const totalUsers =
    "total" in authUsers && typeof authUsers.total === "number"
      ? authUsers.total
      : users.length;

  return {
    totalUsers,
    totalAdmins: profiles.filter((p) => p.role === "admin").length,
    totalRegularUsers: profiles.filter((p) => p.role === "user").length,
    newUsersThisMonth,
    totalProducts: productsResult.count ?? 0,
    totalIngredients: ingredientsResult.count ?? 0,
    pendingSubmissions: submissionsResult.count ?? 0,
  };
};
