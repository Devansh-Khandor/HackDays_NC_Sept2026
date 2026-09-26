import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { homeForRole, roleForUser, roles, type Role } from "./policy";
import { AppError } from "@/lib/server/errors";
export type SessionUser = { id: string; email: string; role: Role };
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  if (!supabaseConfig()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const base = roleForUser(data.user);
  if (!base) return null;
  // The database is authoritative for employee membership.
  const { data: dbRole } = await supabase.rpc("campus_role");
  const role = roles.includes(dbRole) ? (dbRole as Role) : base;
  return { id: data.user.id, email: data.user.email!.toLowerCase(), role };
});
export async function requireUser() {
  const user = await currentUser();
  if (!user)
    throw new AppError(
      "Please sign in with a verified @ncsu.edu account to continue.",
      401,
    );
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin")
    throw new AppError(
      "Only the CampusFix administrator can perform this action.",
      403,
    );
  return user;
}
export async function requirePageUser(only?: Role) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (only && user.role !== only) redirect(homeForRole(user.role));
  return user;
}
