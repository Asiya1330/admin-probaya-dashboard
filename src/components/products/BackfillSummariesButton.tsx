"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import { backfillProductSummaries } from "@/actions/products.actions";
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

const BACKFILL_SUMMARIES_TOOLTIP =
  "Fills all empty score summaries and short descriptions with AI. AI reads each product’s full record, then writes those fields only where they are currently empty, and saves the results.";

type BackfillSummariesButtonProps = {
  variant?: "outline" | "default";
  className?: string;
};

export const BackfillSummariesButton = ({
  variant = "outline",
  className,
}: BackfillSummariesButtonProps): JSX.Element => {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);

  const handleConfirm = (): void => {
    setIsBackfilling(true);
    void backfillProductSummaries().then((response) => {
      setIsBackfilling(false);

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
              disabled={isBackfilling}
              onClick={(): void => setConfirmOpen(true)}
            >
              {isBackfilling ? (
                <>
                  <LoadingSpinner />
                  Backfilling...
                </>
              ) : (
                <>
                  <FileText className="size-4" />
                  Backfill summaries
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="max-w-xs">
            {BACKFILL_SUMMARIES_TOOLTIP}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open): void => {
          if (!isBackfilling) {
            setConfirmOpen(open);
          }
        }}
        title="Backfill summaries"
        description="This will use AI to fill empty score summaries and short descriptions across the catalog. Existing values are left unchanged. This may take a while on large catalogs."
        confirmLabel="Backfill summaries"
        variant="default"
        isLoading={isBackfilling}
        onConfirm={handleConfirm}
      />
    </>
  );
};
