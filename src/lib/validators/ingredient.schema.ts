import { z } from "zod";

export const IMPACT_SCORES = ["-2", "-1", "0", "1", "2"] as const;

export const INGREDIENT_CLASSIFICATIONS = [
  "Strongly Beneficial",
  "Beneficial",
  "Neutral",
  "Harmful",
  "Strongly Harmful",
  "No Data",
] as const;

export const ingredientFormSchema = z.object({
  ingredient_name: z.string().trim().min(1, "Ingredient name is required"),
  inci_name: z.string().trim().min(1, "INCI name is required"),
  impact_score: z.enum(IMPACT_SCORES, {
    error: "Impact score is required",
  }),
  classification: z.enum(INGREDIENT_CLASSIFICATIONS, {
    error: "Classification is required",
  }),
  plain_english_summary: z
    .string()
    .trim()
    .min(1, "Plain English summary is required"),
  notes: z.string().trim().min(1, "Notes are required"),
});

export type IngredientFormInput = z.infer<typeof ingredientFormSchema>;
