import { type JSX } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function FormLoading(): JSX.Element {
  return (
    <div className="flex-1 space-y-4 overflow-auto p-4 md:p-8">
      <Skeleton className="h-8 w-48" />
      <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
