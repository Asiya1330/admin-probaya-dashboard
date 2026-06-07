export const USER_ROLE_FILTERS = ["all", "admin", "user"] as const;

export type UserRoleFilter = (typeof USER_ROLE_FILTERS)[number];

export const parseUserRoleFilter = (value?: string): UserRoleFilter => {
  if (value === "admin" || value === "user") {
    return value;
  }
  return "all";
};
