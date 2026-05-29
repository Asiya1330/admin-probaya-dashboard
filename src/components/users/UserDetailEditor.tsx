"use client";

import { useState, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRoleBadge } from "@/components/users/UserRoleBadge";
import { useUpdateUserRole } from "@/hooks/useUpdateUserRole";
import type { UserRole, UserWithProfile } from "@/types/database.types";

type UserDetailEditorProps = {
  user: UserWithProfile;
};

export const UserDetailEditor = ({
  user,
}: UserDetailEditorProps): JSX.Element => {
  const [role, setRole] = useState<UserRole>(user.role);
  const mutation = useUpdateUserRole();

  const hasChanges = role !== user.role;

  const handleSave = (): void => {
    mutation.mutate({ userId: user.id, role });
  };

  return (
    <div className="max-w-lg space-y-6 rounded-xl border border-border bg-card p-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="font-medium">{user.email}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Current role</p>
        <UserRoleBadge role={user.role} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="detail-role">Role</Label>
        <Select
          value={role}
          onValueChange={(value): void => {
            setRole(value as UserRole);
          }}
        >
          <SelectTrigger id="detail-role" className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handleSave}
        disabled={!hasChanges || mutation.isPending}
      >
        {mutation.isPending ? "Saving..." : "Save role"}
      </Button>
    </div>
  );
};
