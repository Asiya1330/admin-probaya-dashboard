"use server";

import { revalidatePath } from "next/cache";

import { parseIngredientsList } from "@/lib/ingredients";
import {
  calculateProductScore,
  type ScoredIngredient,
} from "@/lib/scoring/calculate-product-score";
import { requireAdmin } from "@/lib/users";
import type { Ingredient, Product } from "@/types/admin.types";
import type {
  IngredientMatchResult,
  PublishProductWizardInput,
} from "@/types/product-wizard.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function checkBarcodeUnique(
  barcode: string,
): Promise<ActionResult<{ unique: boolean }>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const trimmed = barcode.trim();
  if (!trimmed) {
    return { success: true, data: { unique: false } };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("products")
    .select("id")
    .eq("barcode", trimmed)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { unique: !data } };
}

export async function matchIngredients(
  typedNames: string[],
): Promise<ActionResult<IngredientMatchResult[]>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const uniqueNames = [
    ...new Set(typedNames.map((name) => name.trim()).filter(Boolean)),
  ];

  if (uniqueNames.length === 0) {
    return { success: true, data: [] };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: allIngredients, error } = await admin
    .from("ingredients")
    .select("*");

  if (error) {
    return { success: false, error: error.message };
  }

  const ingredients = allIngredients ?? [];

  const matches = uniqueNames.map((typedName) => {
    const lower = typedName.toLowerCase();
    const ingredient =
      ingredients.find(
        (item) =>
          item.ingredient_name.toLowerCase() === lower ||
          item.inci_name.toLowerCase() === lower,
      ) ?? null;
    return { typedName, ingredient };
  });

  return { success: true, data: matches };
}

export async function searchIngredientsForWizard(
  query: string,
): Promise<ActionResult<Ingredient[]>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return { success: true, data: [] };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("ingredients")
    .select("*")
    .or(
      `ingredient_name.ilike.%${trimmed}%,inci_name.ilike.%${trimmed}%`,
    )
    .limit(10);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}

const upsertFlaggedIngredient = async (
  admin: ReturnType<
    Awaited<typeof import("@/lib/supabase/admin")>["createAdminClient"]
  >,
  productId: string,
  ingredient: PublishProductWizardInput["ingredients"][number],
): Promise<void> => {
  const { data: existing } = await admin
    .from("flagged_ingredients")
    .select("id, product_ids")
    .eq("inci_name", ingredient.inci_name)
    .maybeSingle();

  if (existing) {
    const productIds = existing.product_ids ?? [];
    if (!productIds.includes(productId)) {
      await admin
        .from("flagged_ingredients")
        .update({ product_ids: [...productIds, productId] })
        .eq("id", existing.id);
    }
    return;
  }

  await admin.from("flagged_ingredients").insert({
    inci_name: ingredient.inci_name,
    ingredient_name: ingredient.ingredient_name,
    status: "Pending",
    needs_human_review: true,
    product_ids: [productId],
  });
};

export async function publishProductWizard(
  input: PublishProductWizardInput,
): Promise<ActionResult<Product>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  if (input.ingredients.length === 0) {
    return { success: false, error: "At least one ingredient is required" };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const ingredientsList = input.ingredients
    .map((item) => item.inci_name)
    .join(", ");

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      ...input.product,
      ingredients_list: ingredientsList,
      updatedAt: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (productError) {
    return { success: false, error: productError.message };
  }

  const linkRows = input.ingredients.map((item) => ({
    product_id: product.id,
    ingredient_id: item.ingredient_id,
  }));

  const { error: linkError } = await admin
    .from("product_ingredients")
    .insert(linkRows);

  if (linkError) {
    await admin.from("products").delete().eq("id", product.id);
    return { success: false, error: linkError.message };
  }

  const unscored = input.ingredients.filter(
    (item) => item.impact_score === null || item.impact_score === "",
  );

  for (const ingredient of unscored) {
    await upsertFlaggedIngredient(admin, product.id, ingredient);
  }

  const scoredIngredients: ScoredIngredient[] = input.ingredients
    .filter(
      (item) =>
        item.impact_score !== null &&
        item.impact_score !== "" &&
        item.classification !== "No Data",
    )
    .map((item) => ({
      inci_name: item.inci_name,
      ingredient_name: item.ingredient_name,
      impact_score: Number(item.impact_score),
      classification: item.classification,
      plain_english_summary: item.plain_english_summary,
    }));

  if (unscored.length === 0 && scoredIngredients.length > 0) {
    const scoreResult = calculateProductScore(scoredIngredients);
    if (scoreResult) {
      await admin
        .from("products")
        .update({
          score: scoreResult.score,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", product.id);

      product.score = scoreResult.score;
    }
  }

  revalidatePath("/products");
  return { success: true, data: product };
}

export async function parseIngredientNames(
  raw: string,
): Promise<ActionResult<string[]>> {
  await requireAdmin();
  return { success: true, data: parseIngredientsList(raw) };
}
