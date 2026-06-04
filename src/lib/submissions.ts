import "server-only";

import {
  buildPaginatedResult,
  getRange,
  type PaginatedResult,
} from "@/lib/pagination";
import { requireAdmin } from "@/lib/users";
import type { ProductSubmission } from "@/types/admin.types";

export const SUBMISSION_STATUS_FILTERS = [
  "both",
  "pending",
  "rejected",
] as const;

export type SubmissionStatusFilter = (typeof SUBMISSION_STATUS_FILTERS)[number];

export const parseSubmissionStatusFilter = (
  value?: string,
): SubmissionStatusFilter => {
  if (value === "pending" || value === "rejected") {
    return value;
  }
  return "both";
};

export const getSubmissionsPage = async (
  page: number,
  search?: string,
  statusFilter: SubmissionStatusFilter = "both",
): Promise<PaginatedResult<ProductSubmission>> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { from, to } = getRange(page);

  let query = admin
    .from("product_submissions")
    .select("*", { count: "exact" })
    .order("submitted_at", { ascending: false })
    .range(from, to);

  if (statusFilter === "both") {
    query = query.in("status", ["pending", "rejected"]);
  } else {
    query = query.eq("status", statusFilter);
  }

  if (search) {
    query = query.or(
      `product_name.ilike.%${search}%,brand.ilike.%${search}%,barcode.ilike.%${search}%`,
    );
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return buildPaginatedResult(data ?? [], count ?? 0, page);
};

export const getPendingSubmissionsCount = async (): Promise<number> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { count, error } = await admin
    .from("product_submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    return 0;
  }

  return count ?? 0;
};

export const getSubmissionById = async (
  submissionId: string,
): Promise<ProductSubmission | null> => {
  await requireAdmin();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("product_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (error) {
    return null;
  }

  return data;
};
