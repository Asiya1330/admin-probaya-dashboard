"use client";

import { Check, Sparkles } from "lucide-react";
import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  approveIngredientScore,
  scoreIngredientWithAI,
  scoreIngredientsWithAI,
} from "@/actions/scoring.actions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiScoreSuggestion } from "@/types/admin.types";
import type { WizardIngredient } from "@/types/product-wizard.types";

type Step3ScoreUnscoredProps = {
  ingredients: WizardIngredient[];
  onChange: (ingredients: WizardIngredient[]) => void;
};

const matchResultToItem = (
  item: WizardIngredient,
  requestName: string,
): boolean => {
  const lowerRequest = requestName.toLowerCase();
  return (
    item.inci_name.toLowerCase() === lowerRequest ||
    item.ingredient_name.toLowerCase() === lowerRequest
  );
};

export const Step3ScoreUnscored = ({
  ingredients,
  onChange,
}: Step3ScoreUnscoredProps): JSX.Element => {
  const ingredientsRef = useRef(ingredients);

  useEffect(() => {
    ingredientsRef.current = ingredients;
  }, [ingredients]);

  const replaceIngredients = (
    updater: (items: WizardIngredient[]) => WizardIngredient[],
  ): void => {
    onChange(updater(ingredientsRef.current));
  };

  const unscored = ingredients.filter((i) => i.category === "unscored");
  const isScoringAny = unscored.some((item) => item.isScoring);

  const handleScoreWithAI = async (item: WizardIngredient): Promise<void> => {
    replaceIngredients((items) =>
      items.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              isScoring: true,
              aiSuggestion: null,
              scoringError: null,
            }
          : entry,
      ),
    );

    const result = await scoreIngredientWithAI(item.inci_name);

    replaceIngredients((items) =>
      items.map((entry) => {
        if (entry.id !== item.id) {
          return entry;
        }

        if (!result.success) {
          return {
            ...entry,
            isScoring: false,
            aiSuggestion: null,
            scoringError: result.error,
          };
        }

        return {
          ...entry,
          isScoring: false,
          aiSuggestion: result.data,
          scoringError: null,
        };
      }),
    );
  };

  const handleApprove = async (
    item: WizardIngredient,
    suggestion: AiScoreSuggestion,
  ): Promise<void> => {
    if (!item.ingredient_id) return;

    const result = await approveIngredientScore(
      item.inci_name,
      item.ingredient_name,
      suggestion,
    );

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    replaceIngredients((items) =>
      items.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              category: "scored",
              ingredient_id: result.data.ingredient_id,
              impact_score:
                suggestion.impact_score === "No Data"
                  ? "No Data"
                  : String(suggestion.impact_score),
              classification: suggestion.classification,
              plain_english_summary: suggestion.plain_english_summary,
              scoringDecision: "approved",
              aiSuggestion: null,
              scoringError: null,
            }
          : entry,
      ),
    );
    toast.success(`"${item.ingredient_name}" scored`);
  };

  const handleSkip = (item: WizardIngredient): void => {
    replaceIngredients((items) =>
      items.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              scoringDecision: "skipped",
              aiSuggestion: null,
              scoringError: null,
            }
          : entry,
      ),
    );
  };

  const handleScoreAll = async (): Promise<void> => {
    const toScore = unscored.filter((item) => !item.scoringDecision);
    if (toScore.length === 0) {
      return;
    }

    replaceIngredients((items) =>
      items.map((entry) =>
        toScore.some((item) => item.id === entry.id)
          ? {
              ...entry,
              isScoring: true,
              aiSuggestion: null,
              scoringError: null,
            }
          : entry,
      ),
    );

    const result = await scoreIngredientsWithAI(
      toScore.map((item) => item.inci_name),
    );

    if (!result.success) {
      replaceIngredients((items) =>
        items.map((entry) =>
          toScore.some((item) => item.id === entry.id)
            ? {
                ...entry,
                isScoring: false,
                aiSuggestion: null,
                scoringError: result.error,
              }
            : entry,
        ),
      );
      return;
    }

    replaceIngredients((items) =>
      items.map((entry) => {
        const pendingItem = toScore.find((item) => item.id === entry.id);
        if (!pendingItem) {
          return entry;
        }

        const itemResult = result.data.find((row) =>
          matchResultToItem(pendingItem, row.requestName),
        );

        if (!itemResult?.success || !itemResult.suggestion) {
          return {
            ...entry,
            isScoring: false,
            aiSuggestion: null,
            scoringError:
              itemResult?.error ??
              "Claude failed for this ingredient. Either the ingredient does not exist or the scoring system is down.",
          };
        }

        return {
          ...entry,
          isScoring: false,
          aiSuggestion: itemResult.suggestion,
          scoringError: null,
        };
      }),
    );
  };

  const allDecided = unscored.every((item) => item.scoringDecision !== null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          These ingredients are in the database but have no score yet. You can score them now using AI,
          or skip and they will be added to the flagged ingredients queue automatically when the product
          is published.
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 bg-[#8b5cf6] hover:bg-[#7c3aed]"
          disabled={isScoringAny}
          onClick={() => void handleScoreAll()}
        >
          {isScoringAny ? (
            <>
              <LoadingSpinner />
              Scoring…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Score all with AI
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {unscored.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-xl border border-border bg-card p-4",
              item.scoringDecision === "approved" && "border-[#22c55e]/40",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{item.ingredient_name}</p>
                  {item.scoringDecision === "approved" ? (
                    <Check className="size-4 text-[#22c55e]" />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{item.inci_name}</p>
                <p className="mt-1 text-sm text-amber-300">
                  {item.scoringDecision === "approved"
                    ? `Scored: ${item.impact_score} · ${item.classification}`
                    : item.scoringDecision === "skipped"
                      ? "Skipped — will be flagged on publish"
                      : "Not scored"}
                </p>
              </div>
              {!item.scoringDecision ? (
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed]"
                  disabled={item.isScoring || isScoringAny}
                  onClick={() => void handleScoreWithAI(item)}
                >
                  {item.isScoring ? (
                    <>
                      <LoadingSpinner />
                      Scoring…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Score with AI
                    </>
                  )}
                </Button>
              ) : null}
            </div>

            {item.scoringError ? (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                <p>{item.scoringError}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed]"
                    disabled={isScoringAny}
                    onClick={() => void handleScoreWithAI(item)}
                  >
                    <Sparkles className="size-4" />
                    Retry
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSkip(item)}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ) : null}

            {item.aiSuggestion ? (
              <div className="mt-4 rounded-lg border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 p-4 text-sm">
                <p>
                  <span className="text-muted-foreground">Suggested score:</span>{" "}
                  <span className="font-medium text-white">
                    {item.aiSuggestion.impact_score} — {item.aiSuggestion.classification}
                  </span>
                </p>
                <p className="mt-1">
                  <span className="badge-purple rounded-full border px-2 py-0.5 text-xs capitalize">
                    {item.aiSuggestion.confidence}
                  </span>
                  {item.aiSuggestion.needs_human_review ||
                  item.aiSuggestion.confidence === "low" ? (
                    <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                      Needs review
                    </span>
                  ) : null}
                </p>
                {item.aiSuggestion.short_description ? (
                  <p className="mt-2 text-muted-foreground">
                    {item.aiSuggestion.short_description}
                  </p>
                ) : null}
                <p className="mt-2 text-muted-foreground">{item.aiSuggestion.reasoning}</p>
                <p className="mt-1 text-white">{item.aiSuggestion.plain_english_summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="btn-success border-0"
                    onClick={() => void handleApprove(item, item.aiSuggestion!)}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSkip(item)}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {!allDecided ? (
        <p className="text-sm text-muted-foreground">
          Approve or skip each ingredient, or use &quot;Skip all &amp; continue&quot; below.
        </p>
      ) : null}
    </div>
  );
};

export const Step3FooterActions = ({
  onSkipAll,
  canContinue,
}: {
  onSkipAll: () => void;
  canContinue: boolean;
}): JSX.Element => (
  <div className="flex flex-wrap gap-2">
    <Button type="button" variant="outline" onClick={onSkipAll}>
      Skip all &amp; continue →
    </Button>
    {!canContinue ? (
      <p className="self-center text-xs text-muted-foreground">
        Make a decision on each card or skip all to continue
      </p>
    ) : null}
  </div>
);
