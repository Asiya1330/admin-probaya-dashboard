import { type JSX } from "react";

import type { ProductScoreResult } from "@/lib/scoring/calculate-product-score";

type ScoreBreakdownProps = {
  result: ProductScoreResult;
};

export const ScoreBreakdown = ({ result }: ScoreBreakdownProps): JSX.Element => {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Overall Score</p>
          <p className="text-4xl font-bold text-white">{result.score}</p>
        </div>
        <span className="badge-green rounded-full border px-3 py-1 text-sm">
          {result.rating}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-background p-3">
          <p className="text-xs text-muted-foreground">Beneficial</p>
          <p className="text-xl font-semibold text-[#86efac]">{result.counts.beneficial}</p>
        </div>
        <div className="rounded-lg bg-background p-3">
          <p className="text-xs text-muted-foreground">Harmful</p>
          <p className="text-xl font-semibold text-red-300">{result.counts.harmful}</p>
        </div>
        <div className="rounded-lg bg-background p-3">
          <p className="text-xs text-muted-foreground">Neutral</p>
          <p className="text-xl font-semibold text-[#93c5fd]">{result.counts.neutral}</p>
        </div>
        <div className="rounded-lg bg-background p-3">
          <p className="text-xs text-muted-foreground">No Data</p>
          <p className="text-xl font-semibold text-muted-foreground">{result.counts.noData}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {result.ingredients.map((ingredient) => (
          <div
            key={ingredient.inci_name}
            className="rounded-lg border border-border bg-background p-3 text-sm"
          >
            <p className="font-medium text-white">{ingredient.ingredient_name}</p>
            <p className="text-muted-foreground">
              {ingredient.classification} · Score {ingredient.impact_score ?? "—"}
            </p>
            {ingredient.plain_english_summary ? (
              <p className="mt-1 text-muted-foreground">
                {ingredient.plain_english_summary}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
