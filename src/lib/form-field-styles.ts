import { cn } from "@/lib/utils";

export const invalidFieldClassName =
  "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40";

export const fieldClassName = (invalid: boolean, className?: string): string =>
  cn(invalid && invalidFieldClassName, className);
