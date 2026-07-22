import "server-only";

type AdminApiCallOptions = {
  resource: string;
  action: string;
  id?: string;
  params?: Record<string, string | boolean | number | undefined>;
  body?: unknown;
};

export type AdminApiResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export const callAdminApi = async ({
  resource,
  action,
  id,
  params,
  body,
}: AdminApiCallOptions): Promise<AdminApiResult> => {
  const baseUrl = process.env.ADMIN_API_URL;
  if (!baseUrl) {
    return { ok: false, error: "ADMIN_API_URL is not configured" };
  }

  const adminSecret = process.env.ADMIN_API_KEY;
  if (!adminSecret) {
    return { ok: false, error: "ADMIN_API_KEY is not configured" };
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured" };
  }

  const url = new URL(baseUrl);
  url.searchParams.set("resource", resource);
  url.searchParams.set("action", action);
  if (id) {
    url.searchParams.set("id", id);
  }
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      "x-admin-secret": adminSecret,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: unknown = text;

  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : text || `Admin API request failed (${response.status})`;
    return { ok: false, error: message };
  }

  return { ok: true, data };
};
