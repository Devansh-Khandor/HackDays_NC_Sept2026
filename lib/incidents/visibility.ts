import type { Incident } from "./schema";
import type { SessionUser } from "@/lib/auth/server";
// Reporters see progress, work notes and photos, but not staff email addresses.
export function forViewer(incident: Incident, user: SessionUser): Incident {
  if (user.role === "admin") return incident;
  if (user.role === "employee" && incident.assignedTo === user.email)
    return incident;
  return {
    ...incident,
    assignedTo: null,
    timeline: incident.timeline.map((entry) => ({
      ...entry,
      actor: undefined,
      note:
        entry.status === "assigned" && entry.note?.startsWith("Assigned to ")
          ? undefined
          : entry.note,
    })),
  };
}
