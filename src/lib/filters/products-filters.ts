import { PRODUCT_CATEGORIES } from "@/lib/validators/product.schema";
import { WIZARD_CATEGORIES } from "@/types/product-wizard.types";

export const PRODUCT_FILTER_CATEGORIES = [
  ...new Set([...PRODUCT_CATEGORIES, ...WIZARD_CATEGORIES, "General"]),
].sort();

export const PRODUCT_RATING_FILTERS = [
  "all",
  "unscored",
  "excellent",
  "moderate",
  "poor",
] as const;

export type ProductRatingFilter = (typeof PRODUCT_RATING_FILTERS)[number];

export const parseProductCategoryFilter = (value?: string): string => {
  if (!value || value === "all") {
    return "all";
  }
  return PRODUCT_FILTER_CATEGORIES.includes(value) ? value : "all";
};

export const parseProductRatingFilter = (value?: string): ProductRatingFilter => {
  if (
    value === "unscored" ||
    value === "excellent" ||
    value === "moderate" ||
    value === "poor"
  ) {
    return value;
  }
  return "all";
};
