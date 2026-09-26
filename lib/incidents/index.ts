import "server-only";
import { SupabaseIncidentRepository } from "./supabaseRepository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import type { IncidentRepository } from "./repository";
export async function getRepository(): Promise<IncidentRepository> {
  await requireUser();
  return new SupabaseIncidentRepository(await createSupabaseServerClient());
}
