"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type JSX } from "react";
import { toast } from "sonner";

import { deleteUser } from "@/actions/users.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { USERS_QUERY_KEY } from "@/hooks/useUsers";
import type { UserWithProfile } from "@/types/database.types";

type DeleteUserDialogProps = {
  user: UserWithProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const DeleteUserDialog = ({
  user,
  open,
  onOpenChange,
}: DeleteUserDialogProps): JSX.Element => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      const result = await deleteUser(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success("User deleted successfully");
      onOpenChange(false);
    },
    onError: (error: Error): void => {
      toast.error(error.message);
    },
  });

  const handleDelete = (): void => {
    if (!user) {
      return;
    }
    mutation.mutate(user.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete user</DialogTitle>
          <DialogDescription>
            This will permanently delete {user?.email ?? "this user"} and their
            profile. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
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
          <Button
            type="button"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={handleDelete}
          >
            {mutation.isPending ? "Deleting..." : "Delete user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
