"use client";

import { useQueryClient } from "@tanstack/react-query";

import { fetchUsers } from "@/actions/users.actions";

export const USERS_QUERY_KEY = ["users"] as const;

export const useInvalidateUsers = (): (() => void) => {
  const queryClient = useQueryClient();

  return (): void => {
    void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
  };
};

export const prefetchUsers = async (page = 1, search?: string): Promise<void> => {
  await fetchUsers(page, search);
};
