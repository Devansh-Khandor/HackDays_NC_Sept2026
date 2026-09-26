import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { incidentSchema, type Draft, type Incident } from "./schema";
import type { IncidentRepository } from "./repository";
import type { IncidentAction } from "./workflow";
import { AppError } from "@/lib/server/errors";
export function databaseError(error: { code?: string; message: string }) {
  if (
    [
      "NOT_FOUND",
      "INVALID_TRANSITION",
      "ALREADY_RESOLVED",
      "NOT_EMPLOYEE",
      "NOTE_REQUIRED",
      "INVALID_EMPLOYEE",
    ].includes(error.message)
  )
    throw new Error(error.message);
  if (error.code === "42501")
    throw new AppError(
      "You do not have permission to access or change this report.",
      403,
    );
  if (error.code === "22023")
    throw new AppError("Check the report details and try again.", 400);
  console.error("CampusFix database request failed:", error.code ?? "unknown");
  throw new AppError(
    "The report could not be saved or loaded. Please try again.",
    502,
  );
}
export class SupabaseIncidentRepository implements IncidentRepository {
  constructor(private db: SupabaseClient) {}
  async createIncident(draft: Draft, submissionKey: string) {
    const { data, error } = await this.db.rpc("submit_incident", {
      p_draft: draft,
      p_submission_key: submissionKey,
      p_user_approved: true,
    });
    if (error) databaseError(error);
    return incidentSchema.parse(data);
  }
  async getIncidents() {
    const { data, error } = await this.db
      .from("incidents")
      .select("data")
      .order("created_at", { ascending: false });
    if (error) databaseError(error);
    return (data ?? []).map((r) => incidentSchema.parse(r.data));
  }
  async getIncident(id: string) {
    const { data, error } = await this.db
      .from("incidents")
      .select("data")
      .eq("id", id)
      .maybeSingle();
    if (error) databaseError(error);
    return data ? incidentSchema.parse(data.data) : null;
  }
  async getOpenIncidents(draft?: Draft): Promise<Incident[]> {
    if (!draft)
      return (await this.getIncidents()).filter((i) => i.status !== "resolved");
    const { data, error } = await this.db.rpc("find_duplicate_candidates", {
      p_category: draft.analysis.category,
      p_building: draft.location.building,
    });
    if (error) databaseError(error);
    return (data ?? []).map((r: unknown) => incidentSchema.parse(r));
  }
  async addConfirmation(id: string) {
    const { data, error } = await this.db.rpc("confirm_incident", { p_id: id });
    if (error) databaseError(error);
    return incidentSchema.parse(data);
  }
  // The database checks the signed-in actor, so the caller's claims are not trusted.
  async applyAction(id: string, action: IncidentAction) {
    const { action: name, ...details } = action;
    const { data, error } = await this.db.rpc("act_on_incident", {
      p_id: id,
      p_action: name,
      p_details: details,
    });
    if (error) databaseError(error);
    return incidentSchema.parse(data);
  }
}
