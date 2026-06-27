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

const SCORE_ALL_PRODUCTS_TOOLTIP =
  "Recalculates scores for every product in the catalog using the admin scoring API. Products without scorable ingredients are skipped; only changed scores are written to the database.";

type ScoreAllProductsButtonProps = {
  variant?: "outline" | "default";
  className?: string;
};

export const ScoreAllProductsButton = ({
  variant = "outline",
  className,
}: ScoreAllProductsButtonProps): JSX.Element => {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isScoring, setIsScoring] = useState(false);

  const handleConfirm = (): void => {
    setIsScoring(true);
    void scoreAllProducts().then((response) => {
      setIsScoring(false);

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      const { message, failures } = response.data;
      if (failures?.length) {
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
                  Score all products
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="max-w-xs">
            {SCORE_ALL_PRODUCTS_TOOLTIP}
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
        title="Score all products"
        description="This will recompute scores for every product in the catalog using the same algorithm as individual product scoring. Products with no scorable ingredients are skipped. This may take a while on large catalogs."
        confirmLabel="Score all products"
        variant="default"
        isLoading={isScoring}
        onConfirm={handleConfirm}
      />
    </>
  );
};
