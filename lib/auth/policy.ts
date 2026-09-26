import { z } from "zod";
export const ADMIN_EMAIL = "dkhando@ncsu.edu";
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isCampusEmail = (email: string) =>
  /^[^\s@]+@ncsu\.edu$/.test(normalizeEmail(email));
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
