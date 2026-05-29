import "server-only";

import {
  buildPaginatedResult,
  getRange,
  type PaginatedResult,
} from "@/lib/pagination";
import { getIngredientsByInciNames, parseIngredientsList } from "@/lib/ingredients";
import { requireAdmin } from "@/lib/users";
import type { Product, ProductIngredientStatus } from "@/types/admin.types";
import type { ScoredIngredient } from "@/lib/scoring/calculate-product-score";

export const getProductsPage = async (
  page: number,
  search?: string,
): Promise<PaginatedResult<Product>> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { from, to } = getRange(page);

  let query = admin
    .from("products")
    .select("*", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(
      `product_name.ilike.%${search}%,brand.ilike.%${search}%,barcode.ilike.%${search}%`,
    );
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return buildPaginatedResult(data ?? [], count ?? 0, page);
};

export const getProductById = async (productId: string): Promise<Product | null> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) {
    return null;
  }

  return data;
};

export const getProductIngredientStatuses = async (
  productId: string,
): Promise<ProductIngredientStatus[]> => {
  const product = await getProductById(productId);
  if (!product?.ingredients_list) {
    return [];
  }

  const inciNames = parseIngredientsList(product.ingredients_list);
  const ingredients = await getIngredientsByInciNames(inciNames);
  const ingredientMap = new Map(
    ingredients.map((item) => [item.inci_name.toLowerCase(), item]),
  );

  return inciNames.map((inciName) => {
    const match = ingredientMap.get(inciName.toLowerCase());
    const scored = Boolean(
      match?.impact_score && match.classification && match.classification !== "No Data",
    );

    return {
      inci_name: inciName,
      ingredient_name: match?.ingredient_name ?? inciName,
      ingredient_id: match?.ingredient_id ?? null,
      scored,
      impact_score: match?.impact_score ?? null,
      classification: match?.classification ?? null,
      plain_english_summary: match?.plain_english_summary ?? null,
    };
  });
};

export const getScoredIngredientsForProduct = async (
  productId: string,
): Promise<ScoredIngredient[]> => {
  const statuses = await getProductIngredientStatuses(productId);

  return statuses.map((status) => ({
    inci_name: status.inci_name,
    ingredient_name: status.ingredient_name,
    impact_score: status.impact_score ? Number(status.impact_score) : null,
    classification: status.classification,
    plain_english_summary: status.plain_english_summary,
  }));
};

export const getProductsCount = async (): Promise<number> => {
  await requireAdmin();
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("products")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
};
