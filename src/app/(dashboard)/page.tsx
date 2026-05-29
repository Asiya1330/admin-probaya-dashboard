import {
  FlaskConical,
  Inbox,
  Package,
  Shield,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { type JSX } from "react";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { getDashboardStats } from "@/lib/users";

export default async function DashboardPage(): Promise<JSX.Element> {
  const stats = await getDashboardStats();

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          description="All registered accounts"
          icon={Users}
          accentClassName="text-[#93c5fd]"
        />
        <StatsCard
          title="Products"
          value={stats.totalProducts}
          description="Products in catalog"
          icon={Package}
          accentClassName="text-[#c4b5fd]"
        />
        <StatsCard
          title="Ingredients"
          value={stats.totalIngredients}
          description="Scored ingredients database"
          icon={FlaskConical}
          accentClassName="text-[#86efac]"
        />
        <StatsCard
          title="Pending Submissions"
          value={stats.pendingSubmissions}
          description="Awaiting admin review"
          icon={Inbox}
          accentClassName="text-amber-300"
        />
        <StatsCard
          title="Admins"
          value={stats.totalAdmins}
          description="Users with admin access"
          icon={Shield}
          accentClassName="text-amber-400"
        />
        <StatsCard
          title="Regular Users"
          value={stats.totalRegularUsers}
          description="Standard user accounts"
          icon={UserCheck}
          accentClassName="text-[#94a3b8]"
        />
        <StatsCard
          title="New This Month"
          value={stats.newUsersThisMonth}
          description="Sign-ups since month start"
          icon={UserPlus}
          accentClassName="text-[#86efac]"
        />
      </div>
    </div>
  );
}
