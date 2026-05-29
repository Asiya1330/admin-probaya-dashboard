import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
};

export const getCurrentAdminUser = async (): Promise<AdminUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const displayName = user.email.split("@")[0] ?? "Admin";
  const formattedName =
    displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return {
    id: user.id,
    email: user.email,
    displayName: formattedName,
  };
};
