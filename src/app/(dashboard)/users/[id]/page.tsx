import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type JSX } from "react";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { UserDetailEditor } from "@/components/users/UserDetailEditor";
import { Button } from "@/components/ui/button";
import { formatUserDate } from "@/lib/format";
import { getUserById } from "@/lib/users";

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({
  params,
}: UserDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <PageWrapper
      title="User details"
      description={`Member since ${formatUserDate(user.created_at)}`}
    >
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/users">
            <ArrowLeft className="size-4" />
            Back to users
          </Link>
        </Button>
      </div>
      <UserDetailEditor user={user} />
    </PageWrapper>
  );
}
