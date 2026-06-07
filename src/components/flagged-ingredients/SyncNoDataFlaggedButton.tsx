"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import { syncNoDataToFlaggedIngredients } from "@/actions/flagged-ingredients.actions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SYNC_NO_DATA_TOOLTIP =
  "Finds ingredients with a No Data classification (unscored) that are missing from the flagged queue, then adds or updates them so they can be reviewed and scored.";

type SyncNoDataFlaggedButtonProps = {
  variant?: "outline" | "default";
  className?: string;
};

export const SyncNoDataFlaggedButton = ({
  variant = "outline",
  className,
}: SyncNoDataFlaggedButtonProps): JSX.Element => {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = (): void => {
    setIsSyncing(true);
    void syncNoDataToFlaggedIngredients().then((response) => {
      setIsSyncing(false);

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      toast.success(response.data.message);
      router.refresh();
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={variant}
            className={cn("border-border bg-card", className)}
            disabled={isSyncing}
            onClick={handleSync}
          >
            {isSyncing ? (
              <>
                <LoadingSpinner />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Sync No Data
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          {SYNC_NO_DATA_TOOLTIP}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
