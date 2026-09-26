import type { Draft, Incident, Status } from "./schema";
export interface IncidentRepository {
  createIncident(draft: Draft, submissionKey: string): Promise<Incident>;
  getIncident(id: string): Promise<Incident | null>;
  getIncidents(): Promise<Incident[]>;
  getOpenIncidents(): Promise<Incident[]>;
  addConfirmation(id: string, key: string): Promise<Incident>;
  updateStatus(id: string, status: Status): Promise<Incident>;
}
