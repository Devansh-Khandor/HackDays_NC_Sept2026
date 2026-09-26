import type { Analysis } from "@/lib/incidents/schema";
export const emergencyMessage =
  "CampusFix is not an emergency service. If anyone is in immediate danger, contact 911 or the appropriate campus emergency service. Keep your distance; do not approach or inspect a hazard.";
const emergencyPattern =
  /\b(visible fire|on fire|flames|heavy smoke|active (electrical )?sparking|sparks (coming|flying)|outlet (is )?sparking|uncontrolled flooding|structural collapse|ceiling (is )?collapsing|immediate (danger|threat))\b/i;
export function applySafetyRules(
  analysis: Analysis,
  userContext = "",
): Analysis {
  // User observations also pass through the guardrail so model omissions cannot suppress a warning.
  const observations = [
    ...analysis.visibleEvidence,
    ...analysis.hazards,
    analysis.summary,
    userContext,
  ].join(". ");
  if (analysis.severity === "emergency" || emergencyPattern.test(observations))
    return {
      ...analysis,
      severity: "emergency",
      severityReason:
        "Potential immediate danger was reported. Emergency services may be needed; this app cannot establish that a scene is safe.",
      immediateSafetyMessage: emergencyMessage,
    };
  return analysis;
}
