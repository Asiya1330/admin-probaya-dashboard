import "server-only";

import {
  buildPaginatedResult,
  getRange,
  type PaginatedResult,
} from "@/lib/pagination";
import { requireAdmin } from "@/lib/users";
import type {
  IngredientClassificationFilter,
  IngredientScoreFilter,
} from "@/lib/filters/ingredients-filters";
import type { Ingredient, IngredientAssociatedProduct } from "@/types/admin.types";

export type { IngredientClassificationFilter, IngredientScoreFilter } from "@/lib/filters/ingredients-filters";
export {
  INGREDIENT_CLASSIFICATIONS,
  INGREDIENT_CLASSIFICATION_FILTERS,
  INGREDIENT_SCORE_FILTERS,
  parseIngredientClassificationFilter,
  parseIngredientScoreFilter,
} from "@/lib/filters/ingredients-filters";

export const getIngredientsPage = async (
  page: number,
  search?: string,
  classificationFilter: IngredientClassificationFilter = "all",
  scoreFilter: IngredientScoreFilter = "all",
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

  if (classificationFilter === "unscored") {
    query = query.or("impact_score.is.null,classification.eq.No Data");
  } else if (classificationFilter !== "all") {
    query = query.eq("classification", classificationFilter);
  }

  if (scoreFilter === "scored") {
    query = query.not("impact_score", "is", null).neq("classification", "No Data");
  } else if (scoreFilter === "unscored") {
    query = query.or("impact_score.is.null,classification.eq.No Data");
  }

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

export const getProductsByIngredientId = async (
  ingredientId: string,
): Promise<IngredientAssociatedProduct[]> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: links, error: linksError } = await admin
    .from("product_ingredients")
    .select("product_id")
    .eq("ingredient_id", ingredientId);

  if (linksError || !links?.length) {
    return [];
  }

  const productIds = [...new Set(links.map((link) => link.product_id))];

  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, product_name, brand")
    .in("id", productIds);

  if (productsError) {
    throw new Error(productsError.message);
  }

  return products ?? [];
};

export const parseIngredientsList = (raw: string): string[] => {
  return raw
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};
