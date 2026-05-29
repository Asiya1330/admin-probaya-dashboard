"use client";

import { Sparkles } from "lucide-react";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import {
  approveIngredientScore,
  scoreIngredientWithAI,
} from "@/actions/scoring.actions";
import { saveProductScore } from "@/actions/products.actions";
import { AiScoreSuggestionCard } from "@/components/scoring/AiScoreSuggestionCard";
import { ScoreBreakdown } from "@/components/scoring/ScoreBreakdown";
import { Button } from "@/components/ui/button";
import {
  calculateProductScore,
  type ProductScoreResult,
} from "@/lib/scoring/calculate-product-score";
import type { AiScoreSuggestion, ProductIngredientStatus } from "@/types/admin.types";

type ProductScoringPanelProps = {
  productId: string;
  initialStatuses: ProductIngredientStatus[];
  currentScore: number | null;
};

export const ProductScoringPanel = ({
  productId,
  initialStatuses,
  currentScore,
}: ProductScoringPanelProps): JSX.Element => {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [loadingInci, setLoadingInci] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{
    inciName: string;
    ingredientName: string;
    data: AiScoreSuggestion;
  } | null>(null);
  const [scoreResult, setScoreResult] = useState<ProductScoreResult | null>(
    null,
  );

  const handleScoreWithAI = async (
    inciName: string,
    ingredientName: string,
  ): Promise<void> => {
    setLoadingInci(inciName);
    const result = await scoreIngredientWithAI(inciName);
    setLoadingInci(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setSuggestion({ inciName, ingredientName, data: result.data });
  };

  const handleApprove = async (
    edited?: AiScoreSuggestion,
  ): Promise<void> => {
    if (!suggestion) return;

    const data = edited ?? suggestion.data;
    const result = await approveIngredientScore(
      suggestion.inciName,
      suggestion.ingredientName,
      data,
    );

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setStatuses((prev) =>
      prev.map((item) =>
        item.inci_name === suggestion.inciName
          ? {
              ...item,
              scored: true,
              ingredient_id: result.data.ingredient_id,
              impact_score: String(data.impact_score),
              classification: data.classification,
              plain_english_summary: data.plain_english_summary,
            }
          : item,
      ),
    );
    setSuggestion(null);
    toast.success("Ingredient score approved");
  };

  const handleCalculateScore = async (): Promise<void> => {
    const unscored = statuses.filter((s) => !s.scored);
    if (unscored.length > 0) {
      toast.error(`${unscored.length} ingredient(s) still need scoring`);
      return;
    }

    const calculated = calculateProductScore(
      statuses.map((s) => ({
        inci_name: s.inci_name,
        ingredient_name: s.ingredient_name,
        impact_score: s.impact_score ? Number(s.impact_score) : null,
        classification: s.classification,
        plain_english_summary: s.plain_english_summary,
      })),
    );

    if (!calculated) {
      toast.error("Unable to calculate score");
      return;
    }

    const saveResult = await saveProductScore(productId);
    if (!saveResult.success) {
      toast.error(saveResult.error);
      return;
    }

    setScoreResult(calculated);
    toast.success(`Product score saved: ${calculated.score} (${calculated.rating})`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Ingredient Scoring</h3>
            <p className="text-sm text-muted-foreground">
              Score all ingredients before calculating the product score.
            </p>
          </div>
          {currentScore !== null ? (
            <span className="badge-green rounded-full border px-3 py-1 text-sm">
              Current Score: {currentScore}
            </span>
          ) : null}
        </div>
        <div className="space-y-3">
          {statuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add ingredients to this product to begin scoring.
            </p>
          ) : (
            statuses.map((status) => (
              <div
                key={status.inci_name}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{status.ingredient_name}</p>
                  <p className="text-xs text-muted-foreground">{status.inci_name}</p>
                  {status.scored ? (
                    <p className="mt-1 text-sm text-[#86efac]">
                      Score: {status.impact_score} · {status.classification}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-amber-300">Unscored</p>
                  )}
                </div>
                {!status.scored ? (
                  <Button
                    size="sm"
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed]"
                    disabled={loadingInci === status.inci_name}
                    onClick={(): void => {
                      void handleScoreWithAI(status.inci_name, status.ingredient_name);
                    }}
                  >
                    <Sparkles className="size-4" />
                    {loadingInci === status.inci_name ? "Scoring..." : "Score with AI"}
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>
        {statuses.length > 0 ? (
          <div className="mt-4">
            <Button className="btn-success border-0" onClick={(): void => { void handleCalculateScore(); }}>
              Calculate & Save Product Score
            </Button>
          </div>
        ) : null}
      </div>

      {suggestion ? (
        <AiScoreSuggestionCard
          ingredientName={suggestion.ingredientName}
          suggestion={suggestion.data}
          onApprove={(): void => { void handleApprove(); }}
          onReject={(): void => setSuggestion(null)}
          onEdit={(edited): void => { void handleApprove(edited); }}
        />
      ) : null}

      {scoreResult ? <ScoreBreakdown result={scoreResult} /> : null}
    </div>
  );
};
