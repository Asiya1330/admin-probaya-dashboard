"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/users";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const callAdminApi = async (
  action: "approve" | "reject",
  id: string,
): Promise<ActionResult<void>> => {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const baseUrl = process.env.ADMIN_API_URL;
  if (!baseUrl) {
    return {
      success: false,
      error: "ADMIN_API_URL is not configured",
    };
  }

  const url = new URL(baseUrl);
  url.searchParams.set("resource", "submissions");
  url.searchParams.set("action", action);
  url.searchParams.set("id", id);

  const headers: HeadersInit = {};
  const apiKey = process.env.ADMIN_API_KEY;
  if (apiKey) {
    headers["x-admin-secret"] = apiKey;
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // TODO: Add review_notes to the request body
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey!,
      "x-admin-secret": process.env.ADMIN_API_KEY!,
    },
    body: JSON.stringify({ review_notes: "testing" }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    return {
      success: false,
      error: text || `Failed to ${action} submission`,
    };
  }

  revalidatePath("/submissions");
  return { success: true, data: undefined };
};

export async function approveSubmission(
  submissionId: string,
): Promise<ActionResult<void>> {
  return callAdminApi("approve", submissionId);
}

export async function rejectSubmission(
  submissionId: string,
): Promise<ActionResult<void>> {
  return callAdminApi("reject", submissionId);
}
