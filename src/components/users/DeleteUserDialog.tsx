"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type JSX } from "react";
import { toast } from "sonner";

import { deleteUser } from "@/actions/users.actions";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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
  const router = useRouter();

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
      router.refresh();
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
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete user"
      description={`This will permanently delete ${user?.email ?? "this user"} and their profile. This action cannot be undone.`}
      confirmLabel="Delete user"
      isLoading={mutation.isPending}
      onConfirm={handleDelete}
    />
  );
};
