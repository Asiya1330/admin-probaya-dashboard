"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type JSX } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUserRole } from "@/hooks/useUpdateUserRole";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  updateRoleSchema,
  type UpdateRoleInput,
} from "@/lib/validators/user.schema";
import type { UserRole, UserWithProfile } from "@/types/database.types";

type EditUserRoleDialogProps = {
  user: UserWithProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const EditUserRoleDialog = ({
  user,
  open,
  onOpenChange,
}: EditUserRoleDialogProps): JSX.Element => {
  const mutation = useUpdateUserRole({
    onSuccess: (): void => {
      onOpenChange(false);
    },
  });

  const form = useForm<UpdateRoleInput>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: { role: "user" },
  });

  useEffect(() => {
    if (user) {
      form.reset({ role: user.role });
    }
  }, [user, form]);

  const onSubmit = form.handleSubmit((values): void => {
    if (!user) {
      return;
    }
    mutation.mutate({ userId: user.id, role: values.role as UserRole });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user role</DialogTitle>
          <DialogDescription>
            Change the role for {user?.email ?? "this user"}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              key={user?.id}
              defaultValue={user?.role ?? "user"}
              onValueChange={(value): void => {
                form.setValue("role", value as UserRole, {
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={(): void => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <LoadingSpinner />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
