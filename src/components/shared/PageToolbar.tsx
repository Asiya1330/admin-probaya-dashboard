"use client";

import { Download, Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, type FormEvent, type JSX, type ReactNode } from "react";

import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ToolbarSelectFilterOption = {
  value: string;
  label: string;
};

export type ToolbarSelectFilter = {
  paramKey: string;
  value: string;
  options: readonly ToolbarSelectFilterOption[];
  placeholder?: string;
  /** When selected, the param is removed from the URL */
  clearValue?: string;
};

type PageToolbarProps = {
  total: number;
  resourceLabel: string;
  addHref?: string;
  addLabel?: string;
  showExport?: boolean;
  onExport?: () => void;
  extraActions?: ReactNode;
  selectFilters?: ToolbarSelectFilter[];
};

export const PageToolbar = ({
  total,
  resourceLabel,
  addHref,
  addLabel = "Add New",
  showExport = true,
  onExport,
  extraActions,
  selectFilters,
}: PageToolbarProps): JSX.Element => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [isPending, startTransition] = useTransition();

  const updateParams = (updates: Record<string, string | null>): void => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.set("page", "1");
    startTransition((): void => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleFilterChange = (
    paramKey: string,
    value: string,
    clearValue?: string,
  ): void => {
    updateParams({
      [paramKey]: clearValue && value === clearValue ? null : value,
    });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("search") ?? "");
    updateParams({ search: value || null });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {resourceLabel} Management
          </h2>
          <p className="text-sm text-muted-foreground">
            {total} {resourceLabel.toLowerCase()} total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          {addHref ? (
            <Button asChild className="btn-success border-0">
              <Link href={addHref}>
                <Plus className="size-4" />
                {addLabel}
              </Link>
            </Button>
          ) : null}
          {showExport ? (
            <Button
              type="button"
              className="btn-info border-0"
              onClick={onExport}
            >
              <Download className="size-4" />
              Export
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <form onSubmit={handleSearch} className="flex min-w-[12rem] flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder={`Search ${resourceLabel.toLowerCase()}...`}
              className="border-border bg-card pl-9"
              disabled={isPending}
            />
          </div>
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending ? (
              <>
                <LoadingSpinner />
                Searching...
              </>
            ) : (
              <>
                <Search className="size-4" />
                Search
              </>
            )}
          </Button>
        </form>
        {selectFilters?.map((filter) => (
          <Select
            key={filter.paramKey}
            value={filter.value}
            onValueChange={(value): void => {
              handleFilterChange(filter.paramKey, value, filter.clearValue);
            }}
            disabled={isPending}
          >
            <SelectTrigger className="w-full min-w-[11rem] border-border bg-card sm:w-48">
              <Filter className="size-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder={filter.placeholder ?? "Filter"} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  );
};
