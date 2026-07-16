import type { Ingredient } from "@/types/admin.types";
import type {
  WizardIngredient,
  WizardIngredientCategory,
} from "@/types/product-wizard.types";

export const categorizeIngredient = (
  ingredient: Ingredient | null,
): WizardIngredientCategory => {
  if (!ingredient) {
    return "new";
  }
  if (ingredient.impact_score !== null && ingredient.impact_score !== "") {
    return "scored";
  }
  return "unscored";
};

export const ingredientFromMatch = (
  typedName: string,
  ingredient: Ingredient | null,
): WizardIngredient => {
  const category = categorizeIngredient(ingredient);
  return {
    id: crypto.randomUUID(),
    typedName,
    ingredient_id: ingredient?.ingredient_id ?? null,
    ingredient_name: ingredient?.ingredient_name ?? typedName,
    inci_name: ingredient?.inci_name ?? typedName,
    impact_score: ingredient?.impact_score ?? null,
    classification: ingredient?.classification ?? null,
    plain_english_summary: ingredient?.plain_english_summary ?? null,
    category,
    expanded: category === "new",
    scoringDecision: null,
    aiSuggestion: null,
    isScoring: false,
    draft:
      category === "new"
        ? {
            ingredient_name: typedName,
            inci_name: "",
            classification: "No Data",
            plain_english_summary: "",
            impact_score: "",
            evidence_strength: "",
            conflicting_evidence: "",
            notes: "",
          }
        : undefined,
  };
};

export const getScoreBadgeStyle = (
  score: string | null,
  classification: string | null,
): string => {
  const num = score !== null ? Number(score) : null;
  if (num !== null && num > 0) {
    return "border-[#22c55e]/40 bg-[#22c55e]/15 text-[#86efac]";
  }
  if (num !== null && num < 0) {
    return "border-red-500/40 bg-red-500/15 text-red-300";
  }
  if (classification === "Strongly Beneficial" || classification === "Beneficial") {
    return "border-[#22c55e]/40 bg-[#22c55e]/15 text-[#86efac]";
  }
  if (classification === "Strongly Harmful" || classification === "Harmful") {
    return "border-red-500/40 bg-red-500/15 text-red-300";
  }
  return "border-border bg-muted text-muted-foreground";
};

export const formatScoreLabel = (
  score: string | null,
  classification: string | null,
): string => {
  if (score === null || score === "") {
    return classification ?? "Unscored";
  }
  const prefix = Number(score) > 0 ? `+${score}` : score;
  return `${prefix} ${classification ?? ""}`.trim();
};

export const countIngredientsByCategory = (
  ingredients: WizardIngredient[],
): { total: number; scored: number; unscored: number; newCount: number } => ({
  total: ingredients.length,
  scored: ingredients.filter((i) => i.category === "scored").length,
  unscored: ingredients.filter((i) => i.category === "unscored").length,
  newCount: ingredients.filter((i) => i.category === "new").length,
});

export const isIngredientScoredForWizard = (ingredient: WizardIngredient): boolean =>
  ingredient.category === "scored" &&
  ingredient.impact_score !== null &&
  ingredient.impact_score !== "";

export const parseIngredientsList = (raw: string): string[] =>
  raw
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
