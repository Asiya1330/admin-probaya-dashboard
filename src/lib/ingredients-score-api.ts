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

type IngredientsScoreApiSuccessItem = IngredientsScoreApiItem & {
  success: true;
};

type IngredientsScoreApiFailureItem = {
  success: false;
  ingredient_name: string;
  reason: string;
  claude_response?: {
    ingredient_name: string;
    inci_name: string | null;
    suggested_impact_score: string;
    classification: string;
    confidence: string;
    severity_tier: string | null;
    brief_reasoning: string;
    plain_english_summary: string;
    short_description: string | null;
    needs_human_review: boolean;
    pubmed_link: string | null;
  };
};

type IngredientsScoreApiResponseItem =
  | IngredientsScoreApiSuccessItem
  | IngredientsScoreApiFailureItem;

type IngredientsScoreApiResponse = {
  success?: boolean;
  data?: {
    ingredients?: IngredientsScoreApiResponseItem[];
  };
  error?: string;
};

export type IngredientScoreRequestResult = {
  requestName: string;
  success: boolean;
  suggestion?: AiScoreSuggestion;
  error?: string;
  /** Set when the API returned `success: false` but included `claude_response` data. */
  failureReason?: string;
};

export const INGREDIENT_SCORE_FAILURE_MESSAGE =
  "Claude failed for this ingredient. Either the ingredient does not exist or the scoring system is down.";

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

const parseImpactScore = (value: string | null | undefined): ImpactScore | "No Data" => {
  if (!value || value.trim().toLowerCase() === "no data") {
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

const buildFailureResults = (
  requestNames: string[],
  error = INGREDIENT_SCORE_FAILURE_MESSAGE,
): IngredientScoreRequestResult[] =>
  requestNames.map((requestName) => ({
    requestName,
    success: false,
    error,
  }));

const toSuggestionItem = (
  item: IngredientsScoreApiResponseItem,
): IngredientsScoreApiItem | null => {
  if (item.success) return item;
  if (item.claude_response) {
    return {
      ingredient_name: item.claude_response.ingredient_name,
      inci_name: item.claude_response.inci_name ?? item.ingredient_name,
      suggested_impact_score: item.claude_response.suggested_impact_score,
      classification: item.claude_response.classification,
      confidence: item.claude_response.confidence,
      severity_tier: item.claude_response.severity_tier,
      brief_reasoning: item.claude_response.brief_reasoning,
      plain_english_summary: item.claude_response.plain_english_summary,
      short_description: item.claude_response.short_description,
      pubmed_link: item.claude_response.pubmed_link,
      needs_human_review: item.claude_response.needs_human_review,
      flagged_id: null,
    };
  }
  return null;
};

const matchApiItemsToRequests = (
  requestNames: string[],
  apiItems: IngredientsScoreApiResponseItem[],
): IngredientScoreRequestResult[] => {
  const usedIndices = new Set<number>();

  return requestNames.map((requestName, index) => {
    const lowerRequest = requestName.toLowerCase();

    let matchedIndex = apiItems.findIndex(
      (item, itemIndex) =>
        !usedIndices.has(itemIndex) &&
        item.ingredient_name.toLowerCase() === lowerRequest,
    );

    if (matchedIndex === -1) {
      matchedIndex = apiItems.findIndex(
        (item, itemIndex) =>
          !usedIndices.has(itemIndex) &&
          item.success &&
          item.inci_name.toLowerCase() === lowerRequest,
      );
    }

    if (matchedIndex === -1 && !usedIndices.has(index) && apiItems[index]) {
      matchedIndex = index;
    }

    if (matchedIndex === -1) {
      return {
        requestName,
        success: false,
        error: INGREDIENT_SCORE_FAILURE_MESSAGE,
      };
    }

    usedIndices.add(matchedIndex);

    const rawItem = apiItems[matchedIndex]!;
    const resolved = toSuggestionItem(rawItem);

    if (!resolved) {
      return {
        requestName,
        success: false,
        error:
          !rawItem.success && rawItem.reason
            ? rawItem.reason
            : INGREDIENT_SCORE_FAILURE_MESSAGE,
      };
    }

    if (!rawItem.success) {
      return {
        requestName,
        success: false,
        suggestion: mapIngredientsScoreItemToSuggestion(resolved),
        failureReason: rawItem.reason ?? INGREDIENT_SCORE_FAILURE_MESSAGE,
      };
    }

    return {
      requestName,
      success: true,
      suggestion: mapIngredientsScoreItemToSuggestion(resolved),
    };
  });
};

export const scoreIngredientsWithApi = async (
  ingredients: string[],
): Promise<{
  ok: boolean;
  results: IngredientScoreRequestResult[];
  error?: string;
}> => {
  const adminSecret = process.env.ADMIN_API_KEY;
  if (!adminSecret) {
    const error = "ADMIN_API_KEY is not configured";
    return {
      ok: false,
      error,
      results: buildFailureResults(ingredients, error),
    };
  }

  const trimmed = ingredients.map((name) => name.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    const error = "At least one ingredient name is required";
    return { ok: false, error, results: [] };
  }

  let url: string;
  try {
    url = getIngredientsScoreApiUrl();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Scoring API URL not configured";
    return {
      ok: false,
      error: message,
      results: buildFailureResults(trimmed, INGREDIENT_SCORE_FAILURE_MESSAGE),
    };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": adminSecret,
      },
      body: JSON.stringify({ ingredients: trimmed }),
    });
  } catch {
    return {
      ok: false,
      error: INGREDIENT_SCORE_FAILURE_MESSAGE,
      results: buildFailureResults(trimmed, INGREDIENT_SCORE_FAILURE_MESSAGE),
    };
  }

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
          : INGREDIENT_SCORE_FAILURE_MESSAGE;

    return {
      ok: false,
      error: message,
      results: buildFailureResults(trimmed, INGREDIENT_SCORE_FAILURE_MESSAGE),
    };
  }

  const apiItems: IngredientsScoreApiResponseItem[] | null =
    typeof payload === "object" &&
    payload !== null &&
    payload.data?.ingredients?.length
      ? payload.data.ingredients
      : null;

  if (!apiItems) {
    return {
      ok: false,
      error: "Scoring API returned no ingredient results",
      results: buildFailureResults(trimmed, INGREDIENT_SCORE_FAILURE_MESSAGE),
    };
  }

  const results = matchApiItemsToRequests(trimmed, apiItems);

  return {
    ok: results.every((result) => result.success),
    results,
  };
};
