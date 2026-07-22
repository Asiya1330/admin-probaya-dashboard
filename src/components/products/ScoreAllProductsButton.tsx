"use client";

import { Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import { scoreAllProducts } from "@/actions/products.actions";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ScoreAllProductsButtonProps = {
  /** When false, scores are recalculated without regenerating summaries. Defaults to true. */
  generateSummaries?: boolean;
  variant?: "outline" | "default";
  className?: string;
};

export const ScoreAllProductsButton = ({
  generateSummaries = true,
  variant = "outline",
  className,
}: ScoreAllProductsButtonProps): JSX.Element => {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isScoring, setIsScoring] = useState(false);

  const label = generateSummaries
    ? "Score all products"
    : "Score all (skip summaries)";

  const tooltip = generateSummaries
    ? "Recalculates scores for every product and regenerates score summaries by default when scores change."
    : "Recalculates scores without regenerating summaries. Where scores change, score_summary is cleared — run Backfill summaries afterward to refill empty summaries.";

  const confirmDescription = generateSummaries
    ? "This will recompute scores for every product in the catalog. When a score changes, score summaries are regenerated. Products with no scorable ingredients are skipped. This may take a while on large catalogs."
    : "This will recompute scores without regenerating summaries. Where a score changes, score_summary is set to null. After this finishes, run Backfill summaries to regenerate empty score summaries and short descriptions.";

  const handleConfirm = (): void => {
    setIsScoring(true);
    void scoreAllProducts({ generateSummaries }).then((response) => {
      setIsScoring(false);

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      const { message, failures } = response.data;
      if (!generateSummaries) {
        toast.warning(message, { duration: 10_000 });
      } else if (failures?.length) {
        toast.warning(message);
      } else {
        toast.success(message);
      }

      setConfirmOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={variant}
              className={cn("border-border bg-card", className)}
              disabled={isScoring}
              onClick={(): void => setConfirmOpen(true)}
            >
              {isScoring ? (
                <>
                  <LoadingSpinner />
                  Scoring...
                </>
              ) : (
                <>
                  <Calculator className="size-4" />
                  {label}
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="max-w-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open): void => {
          if (!isScoring) {
            setConfirmOpen(open);
          }
        }}
        title={label}
        description={confirmDescription}
        confirmLabel={label}
        variant="default"
        isLoading={isScoring}
        onConfirm={handleConfirm}
      />
    </>
  );
};
