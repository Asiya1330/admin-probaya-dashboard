"use server";

import { revalidatePath } from "next/cache";

import { getUsersPage, requireAdmin } from "@/lib/users";
import type { PaginatedResult } from "@/lib/pagination";
import { updateRoleSchema } from "@/lib/validators/user.schema";
import type { Profile, UserRole, UserWithProfile } from "@/types/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function fetchUsers(
  page = 1,
  search?: string,
): Promise<ActionResult<PaginatedResult<UserWithProfile>>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const users = await getUsersPage(page, search);
    return { success: true, data: users };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    return { success: false, error: message };
  }
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<ActionResult<Profile>> {
  console.log("before auth", userId, role);
  const auth = await requireAdmin();
  console.log("after auth", auth);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  console.log("before parsing", userId, role);
  const parsed = updateRoleSchema.safeParse({ role });
  console.log("after parsing", parsed);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid role" };
  }


  if (userId === auth.userId && role !== "admin") {
    return {
      success: false,
      error: "You cannot remove your own admin role",
    };
  }

  const supabaseAdmin = await createAdminClient();

  console.log("before updating", userId, parsed.data.role);
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", userId)
    .select("id, role")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);

  return { success: true, data };
}

export async function deleteUser(
  userId: string,
): Promise<ActionResult<void>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  if (userId === auth.userId) {
    return { success: false, error: "You cannot delete your own account" };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/users");

  return { success: true, data: undefined };
}
