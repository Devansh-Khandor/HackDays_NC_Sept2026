import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/server";
import { databaseError } from "@/lib/incidents/supabaseRepository";
export const employeeSchema = z.object({
  email: z.string(),
  addedAt: z.string(),
  registered: z.boolean(),
  openTickets: z.number().int(),
});
export type Employee = z.infer<typeof employeeSchema>;
export async function listEmployees() {
  await requireAdmin();
  const db = await createSupabaseServerClient();
  const { data, error } = await db.rpc("list_employees");
  if (error) databaseError(error);
  return z.array(employeeSchema).parse(data ?? []);
}
export async function addEmployee(email: string) {
  await requireAdmin();
  const db = await createSupabaseServerClient();
  const { error } = await db.rpc("add_employee", { p_email: email });
  if (error) databaseError(error);
}
export async function removeEmployee(email: string) {
  await requireAdmin();
  const db = await createSupabaseServerClient();
  const { error } = await db.rpc("remove_employee", { p_email: email });
  if (error) databaseError(error);
}
