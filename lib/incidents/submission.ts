import "server-only";
import { submissionSchema } from "./schema";
import { getRepository } from "./index";
import { applySafetyRules } from "@/lib/safety/safetyRules";
import { routeIncident } from "@/lib/routing/routingEngine";
// Narrow, deterministic action boundary: approval and validation precede every write.
export async function submitIncident(input: unknown) {
  const data = submissionSchema.parse(input);
  data.analysis = routeIncident(applySafetyRules(data.analysis), data.location);
  return getRepository().createIncident(data, data.submissionKey);
}
