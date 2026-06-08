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
import type {
  IngredientSortField,
  IngredientSortOrder,
} from "@/lib/filters/ingredients-filters";
import type {
  Ingredient,
  IngredientAssociatedProduct,
  IngredientWithProductCount,
} from "@/types/admin.types";

export type { IngredientClassificationFilter, IngredientScoreFilter } from "@/lib/filters/ingredients-filters";
export {
  INGREDIENT_CLASSIFICATIONS,
  INGREDIENT_CLASSIFICATION_FILTERS,
  INGREDIENT_SCORE_FILTERS,
  parseIngredientClassificationFilter,
  parseIngredientScoreFilter,
} from "@/lib/filters/ingredients-filters";

type SupabaseAdminClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
>;

const getProductCountsByIngredientIds = async (
  admin: SupabaseAdminClient,
  ingredientIds: string[],
): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();

  if (ingredientIds.length === 0) {
    return counts;
  }

  const { data: links, error } = await admin
    .from("product_ingredients")
    .select("ingredient_id")
    .in("ingredient_id", ingredientIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const link of links ?? []) {
    counts.set(link.ingredient_id, (counts.get(link.ingredient_id) ?? 0) + 1);
  }

  return counts;
};

const attachProductCounts = (
  ingredients: Ingredient[],
  counts: Map<string, number>,
): IngredientWithProductCount[] =>
  ingredients.map((ingredient) => ({
    ...ingredient,
    product_count: counts.get(ingredient.ingredient_id) ?? 0,
  }));

const sortIngredients = (
  ingredients: IngredientWithProductCount[],
  sortField: IngredientSortField,
  sortOrder: IngredientSortOrder,
): IngredientWithProductCount[] => {
  const direction = sortOrder === "asc" ? 1 : -1;

  return [...ingredients].sort((left, right) => {
    if (sortField === "products") {
      const countDiff = left.product_count - right.product_count;
      if (countDiff !== 0) {
        return countDiff * direction;
      }
      return left.ingredient_name.localeCompare(right.ingredient_name);
    }

    return left.ingredient_name.localeCompare(right.ingredient_name) * direction;
  });
};

export const getIngredientsPage = async (
  page: number,
  search?: string,
  classificationFilter: IngredientClassificationFilter = "all",
  scoreFilter: IngredientScoreFilter = "all",
  sortField: IngredientSortField = "products",
  sortOrder: IngredientSortOrder = "desc",
): Promise<PaginatedResult<IngredientWithProductCount>> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { from, to } = getRange(page);

  let query = admin.from("ingredients").select("*", { count: "exact" });

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

  if (sortField === "name") {
    query = query
      .order("ingredient_name", { ascending: sortOrder === "asc" })
      .range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const ingredients = data ?? [];
    const counts = await getProductCountsByIngredientIds(
      admin,
      ingredients.map((ingredient) => ingredient.ingredient_id),
    );

    return buildPaginatedResult(
      attachProductCounts(ingredients, counts),
      count ?? 0,
      page,
    );
  }

  const { data, count, error } = await query.order("ingredient_name", {
    ascending: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const allIngredients = data ?? [];
  const counts = await getProductCountsByIngredientIds(
    admin,
    allIngredients.map((ingredient) => ingredient.ingredient_id),
  );
  const sorted = sortIngredients(
    attachProductCounts(allIngredients, counts),
    sortField,
    sortOrder,
  );

  return buildPaginatedResult(
    sorted.slice(from, to + 1),
    count ?? sorted.length,
    page,
  );
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
