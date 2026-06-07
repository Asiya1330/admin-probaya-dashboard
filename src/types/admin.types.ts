import type { Database } from "@/types/database.types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type Ingredient = Database["public"]["Tables"]["ingredients"]["Row"];
export type IngredientInsert =
  Database["public"]["Tables"]["ingredients"]["Insert"];
export type IngredientUpdate =
  Database["public"]["Tables"]["ingredients"]["Update"];

export type ProductSubmission =
  Database["public"]["Tables"]["product_submissions"]["Row"];

export type FlaggedIngredient =
  Database["public"]["Tables"]["flagged_ingredients"]["Row"];

export type ImpactScore = -2 | -1 | 0 | 1 | 2;
export type ConfidenceLevel = "high" | "medium" | "low";

export type AiScoreSuggestion = {
  impact_score: ImpactScore;
  confidence: ConfidenceLevel;
  reasoning: string;
  classification: string;
  plain_english_summary: string;
};

export type ProductIngredientStatus = {
  inci_name: string;
  ingredient_name: string;
  ingredient_id: string | null;
  scored: boolean;
  impact_score: string | null;
  classification: string | null;
  plain_english_summary: string | null;
};

export type IngredientAssociatedProduct = {
  id: string;
  product_name: string | null;
  brand: string | null;
};

export type FlaggedIngredientProductLink = {
  id: string;
  product_name: string | null;
  brand: string | null;
};
