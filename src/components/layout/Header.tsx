"use client";

import { LogOut, Menu } from "lucide-react";
import { useTransition, type JSX } from "react";

import { signOut } from "@/actions/auth.actions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";

type HeaderProps = {
  userName?: string;
  userEmail?: string;
  pendingSubmissions?: number;
  pendingFlaggedIngredients?: number;
};

export const Header = ({
  userName,
  userEmail,
  pendingSubmissions,
  pendingFlaggedIngredients,
}: HeaderProps): JSX.Element => {
  const [isSigningOut, startTransition] = useTransition();

  const handleSignOut = (): void => {
    startTransition(async (): Promise<void> => {
      await signOut();
    });
  };

  return (
    <header className="flex h-auto shrink-0 items-center justify-between border-b border-border bg-background px-4 py-4 md:px-8">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <Sidebar
              userName={userName}
              userEmail={userEmail}
              pendingSubmissions={pendingSubmissions}
              pendingFlaggedIngredients={pendingFlaggedIngredients}
            />
          </SheetContent>
        </Sheet>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Welcome back, {userName ?? "Admin"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your content and review submissions
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isSigningOut}
        onClick={handleSignOut}
        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {isSigningOut ? (
          <>
            <LoadingSpinner />
            Signing out...
          </>
        ) : (
          <>
            <LogOut className="size-4" />
            Logout
          </>
        )}
      </Button>
    </header>
  );
};
