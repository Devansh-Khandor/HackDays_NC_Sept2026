import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { roleForUser } from "./policy";
import { AppError } from "@/lib/server/errors";
export const currentUser = cache(async (): Promise<{id:string;email:string;role:"admin"|"student"} | null> => {
  if (!supabaseConfig()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const role = roleForUser(data.user);
  return role ? { id: data.user.id, email: data.user.email!, role } : null;
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
export async function requirePageUser(admin = false) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (admin && user.role !== "admin") redirect("/my-reports");
  return user;
}
