"use client";

import { type JSX } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductSubmission } from "@/types/admin.types";

type SubmissionReviewDialogProps = {
  submission: ProductSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SubmissionReviewDialog = ({
  submission,
  open,
  onOpenChange,
}: SubmissionReviewDialogProps): JSX.Element => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{submission?.product_name}</DialogTitle>
          <DialogDescription>
            Review submission details before approving or rejecting.
          </DialogDescription>
        </DialogHeader>
        {submission ? (
          <div className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Brand:</span> {submission.brand}</p>
            <p><span className="text-muted-foreground">Barcode:</span> {submission.barcode}</p>
            <p><span className="text-muted-foreground">Category:</span> {submission.category}</p>
            <p><span className="text-muted-foreground">Submitter:</span> {submission.user_email ?? "Unknown"}</p>
            <p><span className="text-muted-foreground">Scan count:</span> {submission.scan_count}</p>
            <div>
              <p className="text-muted-foreground">Ingredients:</p>
              <p className="mt-1 whitespace-pre-wrap text-white">
                {submission.ingredients ?? "No ingredients provided"}
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
