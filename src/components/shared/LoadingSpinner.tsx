import { Loader2 } from "lucide-react";
import { type JSX } from "react";
import { cn } from "@/lib/utils";
type LoadingSpinnerProps = {
  className?: string;
  label?: string;
};
export const LoadingSpinner = ({
  className,
  label = "Loading",
}: LoadingSpinnerProps): JSX.Element => {
  return (
    <Loader2
      className={cn("size-4 animate-spin", className)}
      aria-label={label}
    />
  );
};
