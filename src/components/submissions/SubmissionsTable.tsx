"use client";

import { Check, Eye, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type JSX } from "react";
import { toast } from "sonner";

import {
  approveSubmission,
  rejectSubmission,
} from "@/actions/submissions.actions";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { FallbackImage } from "@/components/shared/FallbackImage";
import { PageToolbar } from "@/components/shared/PageToolbar";
import { SubmissionReviewDialog } from "@/components/submissions/SubmissionReviewDialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUserDate } from "@/lib/format";
import type { PaginatedResult } from "@/lib/pagination";
import { PRODUCT_FILTER_CATEGORIES } from "@/lib/filters/products-filters";
import type { SubmissionStatusFilter } from "@/lib/filters/submissions-filters";
import { cn } from "@/lib/utils";
import type { ProductSubmission } from "@/types/admin.types";

const SUBMISSION_STATUS_FILTER_OPTIONS = [
  { value: "both", label: "Pending & rejected" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All statuses" },
] as const;

type SubmissionsTableProps = {
  result: PaginatedResult<ProductSubmission>;
  statusFilter: SubmissionStatusFilter;
  categoryFilter: string;
};

type ActionTarget = {
  id: string;
  name: string;
  action: "approve" | "reject";
};

export const SubmissionsTable = ({
  result,
  statusFilter,
  categoryFilter,
}: SubmissionsTableProps): JSX.Element => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reviewItem, setReviewItem] = useState<ProductSubmission | null>(null);
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmAction = (): void => {
    if (!actionTarget) return;

    setIsSubmitting(true);
    startTransition(async (): Promise<void> => {
      const response =
        actionTarget.action === "approve"
          ? await approveSubmission(actionTarget.id)
          : await rejectSubmission(actionTarget.id);
      setIsSubmitting(false);

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      toast.success(`Submission ${actionTarget.action}d`);
      setActionTarget(null);
      router.refresh();
    });
  };

  const confirmTitle =
    actionTarget?.action === "approve"
      ? "Approve submission"
      : "Reject submission";

  const confirmDescription =
    actionTarget?.action === "approve"
      ? `Approve "${actionTarget?.name}" and publish it to the product catalog?`
      : `Reject "${actionTarget?.name}"? This submission will be declined.`;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 md:p-8">
      <PageToolbar
        total={result.total}
        resourceLabel="Submissions"
        showExport={false}
        selectFilters={[
          {
            paramKey: "status",
            value: statusFilter,
            clearValue: "both",
            placeholder: "Status",
            options: [...SUBMISSION_STATUS_FILTER_OPTIONS],
          },
          {
            paramKey: "category",
            value: categoryFilter,
            clearValue: "all",
            placeholder: "Category",
            options: [
              { value: "all", label: "All categories" },
              ...PRODUCT_FILTER_CATEGORIES.map((category) => ({
                value: category,
                label: category,
              })),
            ],
          },
        ]}
      />
        <div className=" rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Preview</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No submissions found.
                  </TableCell>
                </TableRow>
              ) : (
                result.data.map((submission) => {
                  const submissionStatus = submission.status ?? "pending";
                  const canReview = submissionStatus === "pending";

                  return (
                  <TableRow key={submission.id} className="border-border">
                    <TableCell>
                      <div className="relative size-10 overflow-hidden rounded-lg bg-muted">
                        <FallbackImage
                          src={submission.image_url}
                          alt={submission.product_name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {submission.product_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {submission.brand}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {submission.scan_count ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {submission.submitted_at
                        ? formatUserDate(submission.submitted_at)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs capitalize",
                          submissionStatus === "rejected"
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : "badge-purple",
                        )}
                      >
                        {submissionStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isPending}
                          onClick={(): void => setReviewItem(submission)}
                        >
                          <Eye className="size-4 text-[#3b82f6]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isPending || !canReview}
                          onClick={(): void => {
                            setActionTarget({
                              id: submission.id,
                              name: submission.product_name,
                              action: "approve",
                            });
                          }}
                        >
                          <Check className="size-4 text-[#22c55e]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isPending || !canReview}
                          onClick={(): void => {
                            setActionTarget({
                              id: submission.id,
                              name: submission.product_name,
                              action: "reject",
                            });
                          }}
                        >
                          <X className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      <DataTablePagination
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
      />
      <SubmissionReviewDialog
        submission={reviewItem}
        open={reviewItem !== null}
        onOpenChange={(open): void => {
          if (!open) setReviewItem(null);
        }}
      />
      <ConfirmDialog
        open={actionTarget !== null}
        onOpenChange={(open): void => {
          if (!open && !isSubmitting) setActionTarget(null);
        }}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={
          actionTarget?.action === "approve" ? "Approve" : "Reject"
        }
        variant={actionTarget?.action === "approve" ? "default" : "destructive"}
        isLoading={isSubmitting}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
