import { type JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database.types";

type UserRoleBadgeProps = {
  role: UserRole;
};

export const UserRoleBadge = ({ role }: UserRoleBadgeProps): JSX.Element => {
  const isAdmin = role === "admin";

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        isAdmin
          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
          : "border-slate-500/30 bg-slate-500/10 text-slate-300",
      )}
    >
      {role}
    </Badge>
  );
};
