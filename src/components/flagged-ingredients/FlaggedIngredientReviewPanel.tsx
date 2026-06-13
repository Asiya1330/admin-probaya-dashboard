"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import { approveFlaggedIngredient } from "@/actions/flagged-ingredients.actions";
import { scoreIngredientWithAI } from "@/actions/scoring.actions";
import { AiScoreSuggestionCard } from "@/components/scoring/AiScoreSuggestionCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { formatUserDate } from "@/lib/format";
import type { FlaggedIngredientProductLink } from "@/types/admin.types";
import { cn } from "@/lib/utils";
import type { AiScoreSuggestion, FlaggedIngredient } from "@/types/admin.types";

type FlaggedIngredientReviewPanelProps = {
  flagged: FlaggedIngredient;
  linkedProducts: FlaggedIngredientProductLink[];
};

const DetailRow = ({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}): JSX.Element => (
  <div className={cn("space-y-1", className)}>
    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {label}
    </p>
    <div className="text-sm text-white">{value}</div>
  </div>
);

export const FlaggedIngredientReviewPanel = ({
  flagged,
  linkedProducts,
}: FlaggedIngredientReviewPanelProps): JSX.Element => {
  const router = useRouter();
  const [isScoring, setIsScoring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [suggestion, setSuggestion] = useState<AiScoreSuggestion | null>(null);

  const displayName =
    flagged.ingredient_name ?? flagged.inci_name ?? "Flagged ingredient";

  const handleScoreWithAI = async (): Promise<void> => {
    const ingredientName =
      flagged.ingredient_name?.trim() || flagged.inci_name?.trim();
    if (!ingredientName) {
      toast.error("This flagged ingredient has no name to score");
      return;
    }

    setIsScoring(true);
    const response = await scoreIngredientWithAI(ingredientName);
    setIsScoring(false);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    setSuggestion(response.data);
    router.refresh();
  };

  const handleApprove = async (edited?: AiScoreSuggestion): Promise<void> => {
    if (!suggestion && !edited) return;

    setIsApproving(true);
    const response = await approveFlaggedIngredient(
      flagged.id,
      edited ?? suggestion!,
    );
    setIsApproving(false);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    toast.success(`"${displayName}" scored and removed from queue`);
    router.push("/flagged-ingredients");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/flagged-ingredients">
          <ArrowLeft className="size-4" />
          Back to flagged ingredients
        </Link>
      </Button>

      <div>
        <h2 className="text-xl font-semibold text-white">{displayName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review flagged ingredient details and approve an AI score.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Flagged details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Ingredient Name" value={flagged.ingredient_name ?? "—"} />
          <DetailRow label="INCI Name" value={flagged.inci_name ?? "—"} />
          <DetailRow
            label="Status"
            value={
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                {flagged.status}
              </span>
            }
          />
          <DetailRow
            label="Needs Human Review"
            value={flagged.needs_human_review ? "Yes" : "No"}
          />
          <DetailRow
            label="Flagged At"
            value={formatUserDate(flagged.flagged_at)}
          />
          <DetailRow
            label="Stored Impact Score"
            value={flagged.impact_score ?? "—"}
          />
          <DetailRow
            label="Stored Classification"
            value={flagged.classification ?? "—"}
          />
          <DetailRow
            label="Confidence"
            value={flagged.confidence ?? "—"}
          />
        </div>

        {flagged.brief_reasoning ? (
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Brief Reasoning
            </p>
            <p className="text-sm text-muted-foreground">{flagged.brief_reasoning}</p>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">
          Linked products ({linkedProducts.length})
        </h3>
        {linkedProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No linked products recorded for this flagged ingredient.
          </p>
        ) : (
          <ul className="space-y-2">
            {linkedProducts.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}/edit`}
                  className="text-sm text-[#8b5cf6] hover:underline"
                >
                  {product.product_name ?? "Untitled"}
                  {product.brand ? (
                    <span className="text-muted-foreground"> · {product.brand}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">AI scoring</h3>
            <p className="text-sm text-muted-foreground">
              Generate a score suggestion, then approve to update the ingredients
              table and remove this item from the queue.
            </p>
          </div>
          <Button
            className="shrink-0 bg-[#8b5cf6] hover:bg-[#7c3aed]"
            disabled={isScoring || isApproving}
            onClick={() => void handleScoreWithAI()}
          >
            {isScoring ? (
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
        </div>
      </div>

      {suggestion ? (
        <AiScoreSuggestionCard
          ingredientName={displayName}
          suggestion={suggestion}
          isPending={isApproving}
          onApprove={() => void handleApprove()}
          onReject={() => setSuggestion(null)}
          onEdit={(edited) => void handleApprove(edited)}
        />
      ) : null}
    </div>
  );
};
