import type { JSX } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RequiredLabelProps = {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
};

export const RequiredLabel = ({
  htmlFor,
  children,
  className,
}: RequiredLabelProps): JSX.Element => {
  return (
    <Label htmlFor={htmlFor} className={cn(className)}>
      {children}
      <span className="text-destructive" aria-hidden="true">
        *
      </span>
    </Label>
  );
};
