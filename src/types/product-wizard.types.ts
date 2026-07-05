import type { AiScoreSuggestion, Ingredient, ProductInsert } from "@/types/admin.types";

export const WIZARD_CATEGORIES = [
  "pad",
  "liner",
  "tampon",
  "cup",
  "period underwear",
  "wash",
  "wipe",
  "lubricant",
  "condom",
  "other",
] as const;

export type WizardCategory = (typeof WIZARD_CATEGORIES)[number];

export type WizardProductDetails = {
  product_name: string;
  brand: string;
  category: WizardCategory | "";
  barcode: string;
  image_url: string;
  fragrance_type: string;
  bleaching_method: string;
  ph_level: string;
  preservatives: string;
  synthetic_materials: string;
  material_composition: string;
  absorbency: string;
  size_count: string;
  source_url: string;
  usda_organic: string;
  gots_certified: string;
  oeko_tex_certified: string;
  gyno_approved: string;
  verified: boolean;
};

export type NewIngredientDraft = {
  ingredient_name: string;
  inci_name: string;
  classification: string;
  plain_english_summary: string;
  impact_score: string;
  evidence_strength: string;
  conflicting_evidence: string;
  notes: string;
};

export type WizardIngredientCategory = "scored" | "unscored" | "new";

export type ScoringDecision = "approved" | "skipped" | null;

export type WizardIngredient = {
  id: string;
  typedName: string;
  ingredient_id: string | null;
  ingredient_name: string;
  inci_name: string;
  impact_score: string | null;
  classification: string | null;
  plain_english_summary: string | null;
  category: WizardIngredientCategory;
  draft?: NewIngredientDraft;
  expanded?: boolean;
  scoringDecision?: ScoringDecision;
  aiSuggestion?: AiScoreSuggestion | null;
  scoringError?: string | null;
  claudeResponse?: Record<string, unknown> | null;
  isScoring?: boolean;
};

export type PublishProductWizardInput = {
  product: ProductInsert;
  ingredients: Array<{
    ingredient_id: string;
    inci_name: string;
    ingredient_name: string;
    impact_score: string | null;
    classification: string | null;
    plain_english_summary: string | null;
  }>;
};

export type IngredientMatchResult = {
  typedName: string;
  ingredient: Ingredient | null;
};

export const EMPTY_PRODUCT_DETAILS: WizardProductDetails = {
  product_name: "",
  brand: "",
  category: "",
  barcode: "",
  image_url: "",
  fragrance_type: "",
  bleaching_method: "",
  ph_level: "",
  preservatives: "",
  synthetic_materials: "",
  material_composition: "",
  absorbency: "",
  size_count: "",
  source_url: "",
  usda_organic: "",
  gots_certified: "",
  oeko_tex_certified: "",
  gyno_approved: "",
  verified: false,
};

export const EMPTY_INGREDIENT_DRAFT = (
  typedName: string,
): NewIngredientDraft => ({
  ingredient_name: typedName,
  inci_name: "",
  classification: "No Data",
  plain_english_summary: "",
  impact_score: "",
  evidence_strength: "",
  conflicting_evidence: "",
  notes: "",
});
