import "server-only";

import {
  buildPaginatedResult,
  getRange,
  type PaginatedResult,
} from "@/lib/pagination";
import { requireAdmin } from "@/lib/users";
import type {
  FlaggedReviewFilter,
  FlaggedScoreFilter,
} from "@/lib/filters/flagged-ingredients-filters";
import type { FlaggedIngredient, FlaggedIngredientProductLink } from "@/types/admin.types";

export type { FlaggedReviewFilter, FlaggedScoreFilter } from "@/lib/filters/flagged-ingredients-filters";
export {
  FLAGGED_REVIEW_FILTERS,
  FLAGGED_SCORE_FILTERS,
  parseFlaggedReviewFilter,
  parseFlaggedScoreFilter,
} from "@/lib/filters/flagged-ingredients-filters";

export const getFlaggedIngredientsPage = async (
  page: number,
  search?: string,
  reviewFilter: FlaggedReviewFilter = "all",
  scoreFilter: FlaggedScoreFilter = "all",
): Promise<PaginatedResult<FlaggedIngredient>> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { from, to } = getRange(page);

  let query = admin
    .from("flagged_ingredients")
    .select("*", { count: "exact" })
    .eq("status", "Pending")
    .order("flagged_at", { ascending: false })
    .range(from, to);

  if (reviewFilter === "needs_review") {
    query = query.eq("needs_human_review", true);
  } else if (reviewFilter === "ready") {
    query = query.eq("needs_human_review", false);
  }

  if (scoreFilter === "scored") {
    query = query.not("impact_score", "is", null);
  } else if (scoreFilter === "unscored") {
    query = query.is("impact_score", null);
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

export const getFlaggedIngredientById = async (
  flaggedId: string,
): Promise<FlaggedIngredient | null> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("flagged_ingredients")
    .select("*")
    .eq("id", flaggedId)
    .single();

  if (error) {
    return null;
  }

  return data;
};

export const getLinkedProductsForFlagged = async (
  productIds: string[] | null,
): Promise<FlaggedIngredientProductLink[]> => {
  if (!productIds?.length) {
    return [];
  }

  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("products")
    .select("id, product_name, brand")
    .in("id", productIds);

  if (error) {
    return [];
  }

  return data ?? [];
};

export const getPendingFlaggedIngredientsCount = async (): Promise<number> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { count, error } = await admin
    .from("flagged_ingredients")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending");

  if (error) {
    return 0;
  }

  return count ?? 0;
};
