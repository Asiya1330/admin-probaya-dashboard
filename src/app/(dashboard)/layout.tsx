import { Suspense, type JSX } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { getCurrentAdminUser } from "@/lib/auth";
import { getPendingSubmissionsCount } from "@/lib/submissions";

export const dynamic = "force-dynamic";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps): Promise<JSX.Element> {
  const [user, pendingSubmissions] = await Promise.all([
    getCurrentAdminUser(),
    getPendingSubmissionsCount(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Sidebar
          userName={user?.displayName}
          userEmail={user?.email}
          pendingSubmissions={pendingSubmissions}
        />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={user?.displayName}
          userEmail={user?.email}
          pendingSubmissions={pendingSubmissions}
        />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
