import type { Draft, Incident } from "./schema";
import type { Actor, IncidentAction } from "./workflow";
export interface IncidentRepository {
  createIncident(draft: Draft, submissionKey: string): Promise<Incident>;
  getIncident(id: string): Promise<Incident | null>;
  getIncidents(): Promise<Incident[]>;
  getOpenIncidents(draft?: Draft): Promise<Incident[]>;
  addConfirmation(id: string, key?: string): Promise<Incident>;
  applyAction(
    id: string,
    action: IncidentAction,
    actor: Actor,
  ): Promise<Incident>;
}
