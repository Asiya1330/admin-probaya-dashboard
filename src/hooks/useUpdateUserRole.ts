"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateUserRole } from "@/actions/users.actions";
import { USERS_QUERY_KEY } from "@/hooks/useUsers";
import type { Profile, UserRole } from "@/types/database.types";

type UpdateUserRoleVariables = {
  userId: string;
  role: UserRole;
};

type UseUpdateUserRoleOptions = {
  onSuccess?: (profile: Profile) => void;
};

export const useUpdateUserRole = (
  options?: UseUpdateUserRoleOptions,
): ReturnType<
  typeof useMutation<Profile, Error, UpdateUserRoleVariables>
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: UpdateUserRoleVariables): Promise<Profile> => {
      const result = await updateUserRole(userId, role);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (profile): void => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success("User role updated successfully");
      options?.onSuccess?.(profile);
    },
    onError: (error): void => {
      toast.error(error.message);
    },
  });
};
