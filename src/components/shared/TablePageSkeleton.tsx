import { type JSX } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type TablePageSkeletonProps = {
  rows?: number;
  columns?: number;
};

export const TablePageSkeleton = ({
  rows = 8,
  columns = 5,
}: TablePageSkeletonProps): JSX.Element => {
  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 md:p-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`head-${index}`} className="h-4 flex-1" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <Skeleton key={`row-${rowIndex}`} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );
};
