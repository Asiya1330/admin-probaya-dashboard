"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: UpdateUserRoleVariables): Promise<Profile> => {
      console.log("Updating user role", userId, role);
      const result = await updateUserRole(userId, role);
      console.log("Result", result);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (profile): void => {
      console.log("User role updated successfully", profile);
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success("User role updated successfully");
      router.refresh();
      options?.onSuccess?.(profile);
    },
    onError: (error): void => {
      console.error("Error updating user role", error);
      toast.error(error.message);
    },
  });
};
