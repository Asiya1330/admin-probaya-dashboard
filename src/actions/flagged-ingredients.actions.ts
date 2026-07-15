"use server";

import { revalidatePath } from "next/cache";

import { callAdminApi } from "@/lib/admin-api";
import { formatImpactScoreForDb } from "@/lib/ingredients-score-api";
import {
  getLinkedProductsForFlagged,
  removeFlaggedIngredientsAfterApproval,
} from "@/lib/flagged-ingredients";
import { requireAdmin } from "@/lib/users";
import type {
  AiScoreSuggestion,
  FlaggedIngredientProductLink,
} from "@/types/admin.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getFlaggedIngredientLinkedProducts(
  productIds: string[] | null,
): Promise<ActionResult<FlaggedIngredientProductLink[]>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const products = await getLinkedProductsForFlagged(productIds);
    return { success: true, data: products };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load products",
    };
  }
}

export type SyncNoDataFlaggedResult = {
  message: string;
  synced?: boolean;
  inserted?: number;
  updated?: number;
  noDataIngredientCount?: number;
};

const unwrapSyncPayload = (data: unknown): Record<string, unknown> | null => {
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

const parseSyncNoDataResponse = (data: unknown): SyncNoDataFlaggedResult => {
  const payload = unwrapSyncPayload(data);

  if (payload) {
    const synced = payload.synced === true;
    const inserted =
      typeof payload.inserted === "number" ? payload.inserted : undefined;
    const updated =
      typeof payload.updated === "number" ? payload.updated : undefined;
    const noDataIngredientCount =
      typeof payload.no_data_ingredient_count === "number"
        ? payload.no_data_ingredient_count
        : undefined;

    if (typeof payload.message === "string") {
      return {
        message: payload.message,
        synced,
        inserted,
        updated,
        noDataIngredientCount,
      };
    }

    const total = noDataIngredientCount ?? (inserted ?? 0) + (updated ?? 0);

    if (total === 0) {
      return {
        message: "No No Data ingredients needed syncing",
        synced,
        inserted,
        updated,
        noDataIngredientCount,
      };
    }

    const parts: string[] = [];
    if (inserted !== undefined && inserted > 0) {
      parts.push(`${inserted} added`);
    }
    if (updated !== undefined && updated > 0) {
      parts.push(`${updated} updated`);
    }

    const message =
      parts.length > 0
        ? `Synced ${total} No Data ingredient${total === 1 ? "" : "s"} (${parts.join(", ")})`
        : `Processed ${total} No Data ingredient${total === 1 ? "" : "s"}; none were missing from flagged queue`;

    return {
      message,
      synced,
      inserted,
      updated,
      noDataIngredientCount,
    };
  }

  if (typeof data === "string" && data.trim()) {
    return { message: data };
  }

  return { message: "No Data ingredients synced to flagged queue" };
};

export async function syncNoDataToFlaggedIngredients(): Promise<
  ActionResult<SyncNoDataFlaggedResult>
> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const result = await callAdminApi({
    resource: "flagged-ingredients",
    action: "sync-no-data",
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  revalidatePath("/ingredients");
  revalidatePath("/flagged-ingredients");

  return { success: true, data: parseSyncNoDataResponse(result.data) };
}

export async function approveFlaggedIngredient(
  flaggedId: string,
  suggestion: AiScoreSuggestion,
): Promise<ActionResult<void>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: flagged, error: fetchError } = await admin
    .from("flagged_ingredients")
    .select("*")
    .eq("id", flaggedId)
    .single();

  if (fetchError || !flagged) {
    return { success: false, error: "Flagged ingredient not found" };
  }

  const inciName = flagged.inci_name?.trim();
  if (!inciName) {
    return { success: false, error: "Flagged ingredient has no INCI name" };
  }

  const { data: ingredient, error: ingredientError } = await admin
    .from("ingredients")
    .select("ingredient_id")
    .eq("inci_name", inciName)
    .maybeSingle();

  if (ingredientError) {
    return { success: false, error: ingredientError.message };
  }

  if (!ingredient) {
    return {
      success: false,
      error: `No ingredient found with INCI name "${inciName}"`,
    };
  }

  const { error: updateError } = await admin
    .from("ingredients")
    .update({
      impact_score: formatImpactScoreForDb(suggestion.impact_score),
      classification: suggestion.classification,
      plain_english_summary: suggestion.plain_english_summary,
      notes: suggestion.reasoning,
      evidence_strength: suggestion.confidence,
    })
    .eq("ingredient_id", ingredient.ingredient_id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  try {
    await removeFlaggedIngredientsAfterApproval(admin, {
      flaggedId: flagged.id,
      inciName,
      ingredientName: flagged.ingredient_name ?? undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove flagged ingredient after approval";
    return { success: false, error: message };
  }

  revalidatePath("/flagged-ingredients");
  revalidatePath(`/flagged-ingredients/${flaggedId}`);
  revalidatePath("/ingredients");
  return { success: true, data: undefined };
}
