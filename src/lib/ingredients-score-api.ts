import "server-only";

import type { AiScoreSuggestion, ConfidenceLevel, ImpactScore } from "@/types/admin.types";

export type IngredientsScoreApiItem = {
  ingredient_name: string;
  inci_name: string;
  suggested_impact_score: string;
  classification: string;
  confidence: string;
  severity_tier: string | null;
  brief_reasoning: string;
  plain_english_summary: string;
  short_description: string | null;
  pubmed_link: string | null;
  needs_human_review: boolean;
  flagged_id: string | null;
};

type IngredientsScoreApiResponse = {
  success?: boolean;
  data?: {
    ingredients?: IngredientsScoreApiItem[];
  };
  error?: string;
};

const getIngredientsScoreApiUrl = (): string => {
  if (process.env.INGREDIENTS_SCORE_API_URL) {
    return process.env.INGREDIENTS_SCORE_API_URL;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "INGREDIENTS_SCORE_API_URL or NEXT_PUBLIC_SUPABASE_URL must be configured",
    );
  }

  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ingredients-score`;
};

const parseImpactScore = (value: string): ImpactScore | "No Data" => {
  if (value.trim().toLowerCase() === "no data") {
    return "No Data";
  }

  const parsed = Number(value);
  if ([-2, -1, 0, 1, 2].includes(parsed)) {
    return parsed as ImpactScore;
  }

  return "No Data";
};

const parseConfidence = (value: string): ConfidenceLevel => {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "low";
};

export const mapIngredientsScoreItemToSuggestion = (
  item: IngredientsScoreApiItem,
): AiScoreSuggestion => ({
  impact_score: parseImpactScore(item.suggested_impact_score),
  confidence: parseConfidence(item.confidence),
  reasoning: item.brief_reasoning,
  classification: item.classification,
  plain_english_summary: item.plain_english_summary,
  short_description: item.short_description,
  needs_human_review: item.needs_human_review,
  flagged_id: item.flagged_id,
});

export const formatImpactScoreForDb = (
  impactScore: AiScoreSuggestion["impact_score"],
): string => {
  if (impactScore === "No Data") {
    return "No Data";
  }
  return String(impactScore);
};

export const scoreIngredientsWithApi = async (
  ingredients: string[],
): Promise<
  | { ok: true; suggestions: AiScoreSuggestion[] }
  | { ok: false; error: string }
> => {
  const adminSecret = process.env.ADMIN_API_KEY;
  if (!adminSecret) {
    return { ok: false, error: "ADMIN_API_KEY is not configured" };
  }

  const trimmed = ingredients.map((name) => name.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return { ok: false, error: "At least one ingredient name is required" };
  }

  let url: string;
  try {
    url = getIngredientsScoreApiUrl();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Scoring API URL not configured",
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": adminSecret,
    },
    body: JSON.stringify({ ingredients: trimmed }),
  });

  const text = await response.text();
  let payload: IngredientsScoreApiResponse | string = text;

  if (text) {
    try {
      payload = JSON.parse(text) as IngredientsScoreApiResponse;
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : typeof text === "string" && text.trim()
          ? text
          : `Ingredients scoring failed (${response.status})`;
    return { ok: false, error: message };
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !payload.data?.ingredients?.length
  ) {
    return { ok: false, error: "Scoring API returned no ingredient results" };
  }

  return {
    ok: true,
    suggestions: payload.data.ingredients.map(mapIngredientsScoreItemToSuggestion),
  };
};
