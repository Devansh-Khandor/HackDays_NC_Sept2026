import { z } from "zod";
export const ADMIN_EMAIL = "dkhando@ncsu.edu";
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isCampusEmail = (email: string) =>
  /^[^\s@]+@ncsu\.edu$/.test(normalizeEmail(email));
export type Role = "admin" | "employee" | "student";
export const roles = ["admin", "employee", "student"] as const;
// Email-only role check. Employees are stored in the database, so this reports them as
// "student"; use the server's currentUser() when the employee distinction matters.
export function roleForUser(
  user: { email?: string; email_confirmed_at?: string | null } | null,
): "admin" | "student" | null {
  if (!user?.email || !user.email_confirmed_at || !isCampusEmail(user.email))
    return null;
  return normalizeEmail(user.email) === ADMIN_EMAIL ? "admin" : "student";
}
export const credentialsSchema = z.object({
  email: z
    .email()
    .transform(normalizeEmail)
    .refine(isCampusEmail, "Use your @ncsu.edu email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters for your password.")
    .max(128),
});
export const homeForRole = (role: Role) =>
  role === "admin" ? "/admin" : role === "employee" ? "/work" : "/";
export function safeNextPath(value: string | null | undefined, fallback = "/") {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\r\n]/.test(value) ||
    value.startsWith("/auth") ||
    value.startsWith("/login")
  )
    return fallback;
  return value;
}
