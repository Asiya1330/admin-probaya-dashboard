"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, type JSX } from "react";

import { FallbackImage } from "@/components/shared/FallbackImage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  calculateProductScore,
} from "@/lib/scoring/calculate-product-score";
import {
  countIngredientsByCategory,
  formatScoreLabel,
  getScoreBadgeStyle,
  isIngredientScoredForWizard,
} from "@/lib/product-wizard-utils";
import { cn } from "@/lib/utils";
import type {
  WizardIngredient,
  WizardProductDetails,
} from "@/types/product-wizard.types";

type Step4ReviewPublishProps = {
  details: WizardProductDetails;
  ingredients: WizardIngredient[];
  isPublishing: boolean;
  onPublish: () => void;
};

export const Step4ReviewPublish = ({
  details,
  ingredients,
  isPublishing,
  onPublish,
}: Step4ReviewPublishProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false);
  const counts = countIngredientsByCategory(ingredients);
  const flaggedCount = ingredients.filter(
    (i) => !isIngredientScoredForWizard(i),
  ).length;

  const scoredForCalc = ingredients
    .filter(isIngredientScoredForWizard)
    .map((i) => ({
      inci_name: i.inci_name,
      ingredient_name: i.ingredient_name,
      impact_score: Number(i.impact_score),
      classification: i.classification,
      plain_english_summary: i.plain_english_summary,
    }));

  const scorePreview =
    flaggedCount === 0 && scoredForCalc.length > 0
      ? calculateProductScore(scoredForCalc)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Review &amp; Publish</h3>
        <p className="text-sm text-muted-foreground">
          Review everything before creating the product.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-semibold text-white">Product summary</h4>
        <div className="flex gap-4">
          {details.image_url.trim() ? (
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              <FallbackImage
                src={details.image_url}
                alt={details.product_name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="space-y-1 text-sm">
            <p className="font-medium text-white">{details.product_name}</p>
            <p className="text-muted-foreground">{details.brand}</p>
            <p className="text-muted-foreground">
              {details.category} · {details.barcode}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-semibold text-white">Ingredients summary</h4>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-3 py-1 text-xs text-[#86efac]">
            ✓ Scored: {counts.scored}
          </span>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs text-amber-300">
            ⚠ Will be flagged: {flaggedCount}
          </span>
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            Total: {counts.total}
          </span>
        </div>

        <button
          type="button"
          className="mt-3 flex items-center gap-1 text-sm text-[#8b5cf6] hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="size-4" />
              Hide ingredient list
            </>
          ) : (
            <>
              <ChevronDown className="size-4" />
              Show all ingredients
            </>
          )}
        </button>

        {expanded ? (
          <ul className="mt-3 max-h-64 space-y-2 overflow-auto">
            {ingredients.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <div>
                  <span className="text-white">{item.ingredient_name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.inci_name}
                  </span>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs",
                    isIngredientScoredForWizard(item)
                      ? getScoreBadgeStyle(item.impact_score, item.classification)
                      : "border-amber-500/40 bg-amber-500/15 text-amber-300",
                  )}
                >
                  {isIngredientScoredForWizard(item)
                    ? formatScoreLabel(item.impact_score, item.classification)
                    : "Unscored"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {flaggedCount > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {flaggedCount} ingredient(s) have no score. They will be saved to the ingredients table
          and automatically added to the flagged ingredients queue for scoring. This will not affect
          product creation.
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="mb-2 text-sm font-semibold text-white">Score preview</h4>
        {scorePreview ? (
          <div>
            <p className="text-2xl font-bold text-white">{scorePreview.score}</p>
            <p className="text-sm text-[#86efac]">{scorePreview.rating}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Score will be calculated once all flagged ingredients are scored and approved.
          </p>
        )}
      </div>

      <Button
        type="button"
        className="btn-success border-0"
        disabled={isPublishing || ingredients.length === 0}
        onClick={onPublish}
      >
        {isPublishing ? (
          <>
            <LoadingSpinner />
            Creating product…
          </>
        ) : (
          "Create product"
        )}
      </Button>
    </div>
  );
};
