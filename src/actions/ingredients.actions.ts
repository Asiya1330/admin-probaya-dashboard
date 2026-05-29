"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/users";
import type { Ingredient, IngredientInsert } from "@/types/admin.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createIngredient(
  input: IngredientInsert,
): Promise<ActionResult<Ingredient>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("ingredients")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ingredients");
  return { success: true, data };
}

export async function updateIngredient(
  ingredientId: string,
  input: Partial<IngredientInsert>,
): Promise<ActionResult<Ingredient>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("ingredients")
    .update(input)
    .eq("ingredient_id", ingredientId)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ingredients");
  revalidatePath(`/ingredients/${ingredientId}/edit`);
  return { success: true, data };
}

export async function deleteIngredient(
  ingredientId: string,
): Promise<ActionResult<void>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { error } = await admin
    .from("ingredients")
    .delete()
    .eq("ingredient_id", ingredientId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ingredients");
  return { success: true, data: undefined };
}
