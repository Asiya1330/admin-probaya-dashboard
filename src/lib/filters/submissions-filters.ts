import { PRODUCT_FILTER_CATEGORIES } from "@/lib/filters/products-filters";

export const SUBMISSION_STATUS_FILTERS = [
  "both",
  "pending",
  "rejected",
  "all",
] as const;

export type SubmissionStatusFilter = (typeof SUBMISSION_STATUS_FILTERS)[number];

export const parseSubmissionStatusFilter = (
  value?: string,
): SubmissionStatusFilter => {
  if (
    value === "pending" ||
    value === "rejected" ||
    value === "all"
  ) {
    return value;
  }
  return "both";
};

export const parseSubmissionCategoryFilter = (value?: string): string => {
  if (!value || value === "all") {
    return "all";
  }
  return PRODUCT_FILTER_CATEGORIES.includes(value) ? value : "all";
};
