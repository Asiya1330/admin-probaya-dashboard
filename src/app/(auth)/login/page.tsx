import { ShieldCheck } from "lucide-react";
import { type JSX } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<JSX.Element> {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="text-2xl">Admin sign in</CardTitle>
          <CardDescription>
            Sign in with an admin account to manage users and roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm serverError={params.error} />
        </CardContent>
      </Card>
    </div>
  );
}
