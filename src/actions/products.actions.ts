"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { callAdminApi } from "@/lib/admin-api";
import { parseIngredientsList } from "@/lib/ingredients";
import {
  calculateProductScore,
  type ScoredIngredient,
} from "@/lib/scoring/calculate-product-score";
import { requireAdmin } from "@/lib/users";
import type { Product, ProductInsert } from "@/types/admin.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createProduct(
  input: ProductInsert,
): Promise<ActionResult<Product>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("products")
    .insert({ ...input, updatedAt: new Date().toISOString() })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (input.ingredients_list) {
    await linkProductIngredients(data.id, input.ingredients_list);
  }

  revalidatePath("/products");
  return { success: true, data };
}

export async function updateProduct(
  productId: string,
  input: Partial<ProductInsert>,
): Promise<ActionResult<Product>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("products")
    .update({ ...input, updatedAt: new Date().toISOString() })
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (input.ingredients_list) {
    await admin.from("product_ingredients").delete().eq("product_id", productId);
    await linkProductIngredients(productId, input.ingredients_list);
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
  return { success: true, data };
}

const removeProductFromFlaggedIngredients = async (
  admin: Awaited<ReturnType<typeof import("@/lib/supabase/admin")["createAdminClient"]>>,
  productId: string,
): Promise<void> => {
  const { data: flaggedRows, error } = await admin
    .from("flagged_ingredients")
    .select("id, product_ids")
    .contains("product_ids", [productId]);

  if (error || !flaggedRows?.length) {
    return;
  }

  await Promise.all(
    flaggedRows.map((row) => {
      const updatedIds = (row.product_ids ?? []).filter((id) => id !== productId);
      return admin
        .from("flagged_ingredients")
        .update({ product_ids: updatedIds.length > 0 ? updatedIds : null })
        .eq("id", row.id);
    }),
  );
};

export async function deleteProduct(
  productId: string,
): Promise<ActionResult<void>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  await admin.from("product_ingredients").delete().eq("product_id", productId);
  await removeProductFromFlaggedIngredients(admin, productId);

  const { error } = await admin.from("products").delete().eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/flagged-ingredients");
  return { success: true, data: undefined };
}

export async function saveProductScore(
  productId: string,
): Promise<ActionResult<{ score: number; rating: string }>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { getProductIngredientStatuses } = await import("@/lib/products");
  const statuses = await getProductIngredientStatuses(productId);

  const unscored = statuses.filter((item) => !item.scored);
  if (unscored.length > 0) {
    return {
      success: false,
      error: `${unscored.length} ingredient(s) still need scoring`,
    };
  }

  const scoredIngredients: ScoredIngredient[] = statuses.map((status) => ({
    inci_name: status.inci_name,
    ingredient_name: status.ingredient_name,
    impact_score: status.impact_score ? Number(status.impact_score) : null,
    classification: status.classification,
    plain_english_summary: status.plain_english_summary,
  }));

  const result = calculateProductScore(scoredIngredients);
  if (!result) {
    return { success: false, error: "Unable to calculate product score" };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { error } = await admin
    .from("products")
    .update({ score: result.score, updatedAt: new Date().toISOString() })
    .eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);

  return {
    success: true,
    data: { score: result.score, rating: result.rating },
  };
}

export type ScoreAllProductsFailure = {
  product_id: string;
  error: string;
};

export type ScoreAllProductsResult = {
  message: string;
  total_products?: number;
  scored?: number;
  unscored?: number;
  updated?: number;
  unchanged?: number;
  failures?: ScoreAllProductsFailure[];
};

const unwrapScoreAllPayload = (data: unknown): Record<string, unknown> | null => {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (
    "data" in record &&
    typeof record.data === "object" &&
    record.data !== null
  ) {
    return record.data as Record<string, unknown>;
  }

  return record;
};

const parseScoreAllProductsResponse = (data: unknown): ScoreAllProductsResult => {
  const payload = unwrapScoreAllPayload(data);

  if (!payload) {
    return { message: "Product scores recalculated" };
  }

  const total_products =
    typeof payload.total_products === "number" ? payload.total_products : undefined;
  const scored = typeof payload.scored === "number" ? payload.scored : undefined;
  const unscored =
    typeof payload.unscored === "number" ? payload.unscored : undefined;
  const updated = typeof payload.updated === "number" ? payload.updated : undefined;
  const unchanged =
    typeof payload.unchanged === "number" ? payload.unchanged : undefined;

  const failures = Array.isArray(payload.failures)
    ? payload.failures
        .filter(
          (item): item is ScoreAllProductsFailure =>
            typeof item === "object" &&
            item !== null &&
            "product_id" in item &&
            "error" in item &&
            typeof (item as ScoreAllProductsFailure).product_id === "string" &&
            typeof (item as ScoreAllProductsFailure).error === "string",
        )
    : [];

  if (typeof payload.message === "string") {
    return {
      message: payload.message,
      total_products,
      scored,
      unscored,
      updated,
      unchanged,
      failures,
    };
  }

  const parts: string[] = [];
  if (updated !== undefined) {
    parts.push(`${updated} updated`);
  }
  if (unchanged !== undefined) {
    parts.push(`${unchanged} unchanged`);
  }
  if (unscored !== undefined) {
    parts.push(`${unscored} skipped (no scorable ingredients)`);
  }
  if (failures.length > 0) {
    parts.push(`${failures.length} failed`);
  }

  const summary =
    parts.length > 0
      ? parts.join(", ")
      : "Product scores recalculated across the catalog";

  const prefix =
    total_products !== undefined
      ? `Processed ${total_products} product${total_products === 1 ? "" : "s"}`
      : scored !== undefined
        ? `Scored ${scored} product${scored === 1 ? "" : "s"}`
        : "Score all complete";

  return {
    message: `${prefix}: ${summary}`,
    total_products,
    scored,
    unscored,
    updated,
    unchanged,
    failures,
  };
};

export async function scoreAllProducts(): Promise<
  ActionResult<ScoreAllProductsResult>
> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const result = await callAdminApi({
    resource: "products",
    action: "score-all",
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  revalidatePath("/products");
  revalidatePath("/");

  return { success: true, data: parseScoreAllProductsResponse(result.data) };
}

const linkProductIngredients = async (
  productId: string,
  ingredientsList: string,
): Promise<void> => {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const inciNames = parseIngredientsList(ingredientsList);
  if (inciNames.length === 0) {
    return;
  }

  const { data: ingredients } = await admin
    .from("ingredients")
    .select("ingredient_id, inci_name")
    .in("inci_name", inciNames);

  if (!ingredients?.length) {
    return;
  }

  const rows = ingredients.map((ingredient) => ({
    product_id: productId,
    ingredient_id: ingredient.ingredient_id,
  }));

  await admin.from("product_ingredients").insert(rows);
};

export async function createProductAndRedirect(
  formData: FormData,
): Promise<ActionResult<Product>> {
  const result = await createProduct({
    product_name: String(formData.get("product_name") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    barcode: String(formData.get("barcode") ?? "") || null,
    category: String(formData.get("category") ?? "General"),
    image_url: String(formData.get("image_url") ?? "") || null,
    ingredients_list: String(formData.get("ingredients_list") ?? "") || null,
  });

  if (result.success) {
    redirect(`/products/${result.data.id}/edit`);
  }

  return result;
}
