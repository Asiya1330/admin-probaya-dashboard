export type ScoredIngredient = {
  inci_name: string;
  ingredient_name: string;
  impact_score: number | null;
  classification: string | null;
  plain_english_summary: string | null;
};

export type ProductScoreResult = {
  score: number;
  rating: "Microbiome Friendly" | "Use With Caution" | "Not Recommended";
  rawScore: number;
  counts: {
    stronglyBeneficial: number;
    beneficial: number;
    neutral: number;
    harmful: number;
    stronglyHarmful: number;
    noData: number;
  };
  ingredients: ScoredIngredient[];
};

export const getRating = (
  normalizedScore: number,
): ProductScoreResult["rating"] => {
  if (normalizedScore >= 70) {
    return "Microbiome Friendly";
  }
  if (normalizedScore >= 40) {
    return "Use With Caution";
  }
  return "Not Recommended";
};

export const calculateProductScore = (
  ingredients: ScoredIngredient[],
): ProductScoreResult | null => {
  const valid = ingredients.filter(
    (ingredient) =>
      ingredient.classification !== "No Data" &&
      ingredient.impact_score !== null &&
      !Number.isNaN(ingredient.impact_score),
  );

  if (valid.length === 0) {
    return null;
  }

  const rawScore = valid.reduce(
    (sum, ingredient) => sum + Number(ingredient.impact_score),
    0,
  );
  const minimum = valid.length * -2;
  const maximum = valid.length * 2;
  const normalized = Math.round(((rawScore - minimum) / (maximum - minimum)) * 100);

  return {
    score: normalized,
    rating: getRating(normalized),
    rawScore,
    counts: {
      stronglyBeneficial: ingredients.filter(
        (i) => i.classification === "Strongly Beneficial",
      ).length,
      beneficial: ingredients.filter((i) => i.classification === "Beneficial")
        .length,
      neutral: ingredients.filter((i) => i.classification === "Neutral").length,
      harmful: ingredients.filter((i) => i.classification === "Harmful").length,
      stronglyHarmful: ingredients.filter(
        (i) => i.classification === "Strongly Harmful",
      ).length,
      noData: ingredients.filter((i) => i.classification === "No Data").length,
    },
    ingredients,
  };
};

export const isIngredientScored = (
  ingredient: ScoredIngredient | null | undefined,
): boolean => {
  if (!ingredient) {
    return false;
  }
  return (
    ingredient.impact_score !== null &&
    ingredient.classification !== null &&
    ingredient.classification !== "No Data"
  );
};
