import { requireUser } from "@/lib/auth/server";
import {
  clarifyInputSchema,
  clarifyIncident,
} from "@/lib/gemini/clarifyIncident";
import { hasLocation } from "@/lib/incidents/schema";
import { routeIncident } from "@/lib/routing/routingEngine";
import { applySafetyRules } from "@/lib/safety/safetyRules";
import { apiError, readJson } from "@/lib/server/errors";
export async function POST(request: Request) {
  try {
    await requireUser();
    const d = clarifyInputSchema.parse(await readJson(request));
    // Demo explicitly uses the entire answer as a location description, not simulated AI extraction.
    const result =
      d.mode === "demo"
        ? {
            updatedAnalysis: {
              ...d.analysis,
              missingInformation: [],
              clarifyingQuestions: [],
            },
            location: {
              ...d.knownLocation,
              locationDescription: d.userMessage,
            },
            readyForReview: true,
          }
        : await clarifyIncident(
            d.analysis,
            d.knownLocation,
            d.userMessage,
            d.conversationHistory,
          );
    result.updatedAnalysis = routeIncident(
      applySafetyRules(result.updatedAnalysis, d.userMessage),
      result.location,
    );
    if (d.analysis.severity === "emergency")
      result.updatedAnalysis = applySafetyRules({
        ...result.updatedAnalysis,
        severity: "emergency",
      });
    result.readyForReview =
      result.readyForReview && hasLocation(result.location);
    return Response.json(result);
  } catch (e) {
    return apiError(e);
  }
}
