import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/types/database.types";

type SupabaseMiddlewareClient = ReturnType<
  typeof createServerClient<Database>
>;

export type UpdateSessionResult = {
  supabase: SupabaseMiddlewareClient;
  user: Awaited<
    ReturnType<SupabaseMiddlewareClient["auth"]["getUser"]>
  >["data"]["user"];
  response: NextResponse;
};

export const updateSession = async (
  request: NextRequest,
): Promise<UpdateSessionResult> => {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, response };
};
