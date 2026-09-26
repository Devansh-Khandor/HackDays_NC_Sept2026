import { z } from "zod";
import { imagePathSchema, type Incident, type Status } from "./schema";
import type { Role } from "@/lib/auth/policy";
// Ticket lifecycle shared by the UI, the JSON repository and tests.
// The Supabase functions in supabase/migrations enforce the same rules server-side.
//   reported -> acknowledged (admin) -> assigned (admin picks an employee)
//   -> in_progress (employee, optional) -> awaiting_verification (employee submits work)
//   -> resolved (admin verifies) or back to assigned (admin sends it back)
const note = z.string().trim().max(2000);
export const incidentActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("acknowledge") }),
  z.object({
    action: z.literal("assign"),
    assignee: z.email().transform((e) => e.trim().toLowerCase()),
  }),
  z.object({ action: z.literal("start") }),
  z.object({
    action: z.literal("complete"),
    note: note.default(""),
    image: imagePathSchema.default(null),
  }),
  z.object({ action: z.literal("verify"), note: note.default("") }),
  z.object({
    action: z.literal("reject"),
    note: note.min(3, "Tell the employee what still needs attention."),
  }),
]);
export type IncidentAction = z.infer<typeof incidentActionSchema>;
export type ActionName = IncidentAction["action"];
export type Actor = { email: string; role: Role };
const allowedFrom: Record<ActionName, Status[]> = {
  acknowledge: ["reported"],
  assign: ["acknowledged", "assigned", "in_progress"],
  start: ["assigned"],
  complete: ["assigned", "in_progress"],
  verify: ["awaiting_verification"],
  reject: ["awaiting_verification"],
};
const adminActions: ActionName[] = [
  "acknowledge",
  "assign",
  "verify",
  "reject",
];
const nextStatus: Record<ActionName, Status> = {
  acknowledge: "acknowledged",
  assign: "assigned",
  start: "in_progress",
  complete: "awaiting_verification",
  verify: "resolved",
  reject: "assigned",
};
function mayPerform(incident: Incident, actor: Actor, action: ActionName) {
  if (adminActions.includes(action)) return actor.role === "admin";
  return (
    actor.role === "employee" &&
    incident.assignedTo?.toLowerCase() === actor.email.toLowerCase()
  );
}
export function canAct(incident: Incident, actor: Actor, action: ActionName) {
  return (
    allowedFrom[action].includes(incident.status) &&
    mayPerform(incident, actor, action)
  );
}
export function availableActions(incident: Incident, actor: Actor) {
  return (Object.keys(allowedFrom) as ActionName[]).filter((a) =>
    canAct(incident, actor, a),
  );
}
export function applyAction(
  incident: Incident,
  action: IncidentAction,
  actor: Actor,
  at = new Date().toISOString(),
): Incident {
  if (!mayPerform(incident, actor, action.action)) throw new Error("FORBIDDEN");
  if (!allowedFrom[action.action].includes(incident.status))
    throw new Error("INVALID_TRANSITION");
  const status = nextStatus[action.action];
  const entry: Incident["timeline"][number] = {
    status,
    at,
    actor: actor.email,
  };
  if (action.action === "assign") entry.note = `Assigned to ${action.assignee}`;
  if ("note" in action && action.note) entry.note = action.note;
  if (action.action === "complete" && action.image) entry.image = action.image;
  return {
    ...incident,
    status,
    assignedTo:
      action.action === "assign" ? action.assignee : incident.assignedTo,
    updatedAt: at,
    timeline: [...incident.timeline, entry],
  };
}
// The most recent work the employee submitted, for the admin's verification step.
export const latestCompletion = (incident: Incident) =>
  incident.timeline.findLast((e) => e.status === "awaiting_verification");
