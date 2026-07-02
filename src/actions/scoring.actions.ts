"use server";

import { revalidatePath } from "next/cache";

import {
  formatImpactScoreForDb,
  scoreIngredientsWithApi,
  type IngredientScoreRequestResult,
} from "@/lib/ingredients-score-api";
import { removeFlaggedIngredientsAfterApproval } from "@/lib/flagged-ingredients";
import { requireAdmin } from "@/lib/users";
import type { AiScoreSuggestion } from "@/types/admin.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function scoreIngredientsWithAI(
  ingredientNames: string[],
): Promise<ActionResult<IngredientScoreRequestResult[]>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const trimmed = ingredientNames.map((name) => name.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return { success: false, error: "At least one ingredient name is required" };
  }

  const result = await scoreIngredientsWithApi(trimmed);

  revalidatePath("/flagged-ingredients");
  revalidatePath("/ingredients");

  return { success: true, data: result.results };
}

export async function scoreIngredientWithAI(
  ingredientName: string,
): Promise<ActionResult<AiScoreSuggestion>> {
  const batchResult = await scoreIngredientsWithAI([ingredientName]);

  if (!batchResult.success) {
    return { success: false, error: batchResult.error };
  }

  const itemResult = batchResult.data[0];
  if (!itemResult?.success || !itemResult.suggestion) {
    return {
      success: false,
      error: itemResult?.error ?? "Failed to score ingredient",
    };
  }

  return { success: true, data: itemResult.suggestion };
}

export async function approveIngredientScore(
  inciName: string,
  ingredientName: string,
  suggestion: AiScoreSuggestion,
): Promise<ActionResult<{ ingredient_id: string }>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const persistIngredientScore = async (
    ingredientId: string,
  ): Promise<ActionResult<{ ingredient_id: string }>> => {
    try {
      await removeFlaggedIngredientsAfterApproval(admin, {
        flaggedId: suggestion.flagged_id,
        inciName,
        ingredientName,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to remove flagged ingredient after approval";
      return { success: false, error: message };
    }

    revalidatePath("/ingredients");
    revalidatePath("/flagged-ingredients");

    return { success: true, data: { ingredient_id: ingredientId } };
  };

  const { data: existing } = await admin
    .from("ingredients")
    .select("ingredient_id")
    .eq("inci_name", inciName)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("ingredients")
      .update({
        impact_score: formatImpactScoreForDb(suggestion.impact_score),
        classification: suggestion.classification,
        plain_english_summary: suggestion.plain_english_summary,
        notes: suggestion.reasoning,
        evidence_strength: suggestion.confidence,
      })
      .eq("ingredient_id", existing.ingredient_id);

    if (error) {
      return { success: false, error: error.message };
    }

    return persistIngredientScore(existing.ingredient_id);
  }

  const { data, error } = await admin
    .from("ingredients")
    .insert({
      inci_name: inciName,
      ingredient_name: ingredientName,
      impact_score: formatImpactScoreForDb(suggestion.impact_score),
      classification: suggestion.classification,
      plain_english_summary: suggestion.plain_english_summary,
      notes: suggestion.reasoning,
      evidence_strength: suggestion.confidence,
    })
    .select("ingredient_id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return persistIngredientScore(data.ingredient_id);
}
