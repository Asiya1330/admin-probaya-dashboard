import "server-only";

import {
  buildPaginatedResult,
  getRange,
  type PaginatedResult,
} from "@/lib/pagination";
import { requireAdmin } from "@/lib/users";
import type { Ingredient } from "@/types/admin.types";

export const getIngredientsPage = async (
  page: number,
  search?: string,
): Promise<PaginatedResult<Ingredient>> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { from, to } = getRange(page);

  let query = admin
    .from("ingredients")
    .select("*", { count: "exact" })
    .order("ingredient_name", { ascending: true })
    .range(from, to);

  if (search) {
    query = query.or(
      `ingredient_name.ilike.%${search}%,inci_name.ilike.%${search}%`,
    );
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return buildPaginatedResult(data ?? [], count ?? 0, page);
};

export const getIngredientById = async (
  ingredientId: string,
): Promise<Ingredient | null> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("ingredients")
    .select("*")
    .eq("ingredient_id", ingredientId)
    .single();

  if (error) {
    return null;
  }

  return data;
};

export const getIngredientsByInciNames = async (
  inciNames: string[],
): Promise<Ingredient[]> => {
  if (inciNames.length === 0) {
    return [];
  }

  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("ingredients")
    .select("*")
    .in("inci_name", inciNames);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export const parseIngredientsList = (raw: string): string[] => {
  return raw
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};
