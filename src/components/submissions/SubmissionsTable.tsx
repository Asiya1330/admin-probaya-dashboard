"use client";

import { Check, Eye, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import {
  approveSubmission,
  rejectSubmission,
} from "@/actions/submissions.actions";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
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
import type { ProductSubmission } from "@/types/admin.types";

type SubmissionsTableProps = {
  result: PaginatedResult<ProductSubmission>;
};

export const SubmissionsTable = ({
  result,
}: SubmissionsTableProps): JSX.Element => {
  const router = useRouter();
  const [reviewItem, setReviewItem] = useState<ProductSubmission | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const handleAction = async (
    id: string,
    action: "approve" | "reject",
  ): Promise<void> => {
    setActionId(id);
    const response =
      action === "approve"
        ? await approveSubmission(id)
        : await rejectSubmission(id);
    setActionId(null);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    toast.success(`Submission ${action}d`);
    router.refresh();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 md:p-8">
      <PageToolbar
        total={result.total}
        resourceLabel="Submissions"
        showExport={false}
      />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Preview</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No submissions found.
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((submission) => (
                <TableRow key={submission.id} className="border-border">
                  <TableCell>
                    <div className="relative size-10 overflow-hidden rounded-lg bg-muted">
                      {submission.image_url ? (
                        <Image
                          src={submission.image_url}
                          alt={submission.product_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {submission.product_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {submission.brand}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {submission.submitted_at
                      ? formatUserDate(submission.submitted_at)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="badge-purple rounded-full border px-2 py-0.5 text-xs capitalize">
                      {submission.status ?? "pending"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(): void => setReviewItem(submission)}
                      >
                        <Eye className="size-4 text-[#3b82f6]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={actionId === submission.id}
                        onClick={(): void => {
                          void handleAction(submission.id, "approve");
                        }}
                      >
                        <Check className="size-4 text-[#22c55e]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={actionId === submission.id}
                        onClick={(): void => {
                          void handleAction(submission.id, "reject");
                        }}
                      >
                        <X className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
    </div>
  );
};
