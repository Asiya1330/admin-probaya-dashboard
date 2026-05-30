"use client";

import { Download, Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, type FormEvent, type JSX } from "react";

import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PageToolbarProps = {
  total: number;
  resourceLabel: string;
  addHref?: string;
  addLabel?: string;
  showExport?: boolean;
  onExport?: () => void;
};

export const PageToolbar = ({
  total,
  resourceLabel,
  addHref,
  addLabel = "Add New",
  showExport = true,
  onExport,
}: PageToolbarProps): JSX.Element => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [isSearching, startTransition] = useTransition();

  const handleSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("search") ?? "");
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.set("page", "1");

    startTransition((): void => {
      router.push(`${pathname}?${params.toString()}`);
    });
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder={`Search ${resourceLabel.toLowerCase()}...`}
              className="border-border bg-card pl-9"
              disabled={isSearching}
            />
          </div>
          <Button type="submit" variant="outline" disabled={isSearching}>
            {isSearching ? (
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
        <Button variant="outline" type="button" className="border-border bg-card">
          <Filter className="size-4" />
          Filter
        </Button>
      </div>
    </div>
  );
};
