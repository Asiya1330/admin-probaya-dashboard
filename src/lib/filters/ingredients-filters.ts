export const INGREDIENT_CLASSIFICATIONS = [
  "Beneficial",
  "Harmful",
  "Neutral",
  "No Data",
] as const;

export const INGREDIENT_CLASSIFICATION_FILTERS = [
  "all",
  ...INGREDIENT_CLASSIFICATIONS,
  "unscored",
] as const;

export type IngredientClassificationFilter =
  (typeof INGREDIENT_CLASSIFICATION_FILTERS)[number];

export const INGREDIENT_SCORE_FILTERS = ["all", "scored", "unscored"] as const;

export type IngredientScoreFilter = (typeof INGREDIENT_SCORE_FILTERS)[number];

export const parseIngredientClassificationFilter = (
  value?: string,
): IngredientClassificationFilter => {
  if (value === "No Data" || value === "unscored") {
    return "unscored";
  }
  if (
    value === "Beneficial" ||
    value === "Harmful" ||
    value === "Neutral"
  ) {
    return value;
  }
  return "all";
};

export const parseIngredientScoreFilter = (
  value?: string,
): IngredientScoreFilter => {
  if (value === "scored" || value === "unscored") {
    return value;
  }
  return "all";
};
