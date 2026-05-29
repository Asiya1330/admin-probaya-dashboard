import { z } from "zod";

export const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
