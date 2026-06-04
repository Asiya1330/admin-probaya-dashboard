"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FlaskConical,
  Inbox,
  LayoutDashboard,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";
import { type JSX } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

type SidebarProps = {
  userEmail?: string;
  userName?: string;
  pendingSubmissions?: number;
  onNavigate?: () => void;
};

export const Sidebar = ({
  userEmail,
  userName,
  pendingSubmissions = 0,
  onNavigate,
}: SidebarProps): JSX.Element => {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Package },
    { href: "/ingredients", label: "Ingredients", icon: FlaskConical },
    {
      href: "/submissions",
      label: "Submissions",
      icon: Inbox,
      badge: pendingSubmissions,
    },
    { href: "/users", label: "Users", icon: Users },
  ];

  const initials = (userName ?? userEmail ?? "A").slice(0, 1).toUpperCase();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-5">
        <p className="text-xs font-medium tracking-wide text-[#8b5cf6] uppercase">
          Admin Portal
        </p>
        <p className="mt-1 text-sm font-semibold text-white">Probaya</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#8b5cf6] text-white"
                  : "text-sidebar-foreground hover:bg-[#1e293b] hover:text-white",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4 shrink-0" />
                {item.label}
              </span>
              {item.badge && item.badge > 0 ? (
                <span className="badge-green rounded-full px-2 py-0.5 text-xs">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback className="bg-[#ec4899] text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {userName ?? "Admin"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {userEmail ?? ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
