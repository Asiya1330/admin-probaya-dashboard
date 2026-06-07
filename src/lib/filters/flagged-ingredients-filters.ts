export const FLAGGED_REVIEW_FILTERS = ["all", "needs_review", "ready"] as const;

export type FlaggedReviewFilter = (typeof FLAGGED_REVIEW_FILTERS)[number];

export const FLAGGED_SCORE_FILTERS = ["all", "scored", "unscored"] as const;

export type FlaggedScoreFilter = (typeof FLAGGED_SCORE_FILTERS)[number];

export const parseFlaggedReviewFilter = (value?: string): FlaggedReviewFilter => {
  if (value === "needs_review" || value === "ready") {
    return value;
  }
  return "all";
};

export const parseFlaggedScoreFilter = (value?: string): FlaggedScoreFilter => {
  if (value === "scored" || value === "unscored") {
    return value;
  }
  return "all";
};
