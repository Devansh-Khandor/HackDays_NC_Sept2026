import { analysisSchema, type Analysis } from "@/lib/incidents/schema";
export const scenarios = [
  {
    id: "fountain",
    label: "Leaking water fountain",
    category: "plumbing",
    title: "Possible leak beneath drinking fountain",
    summary:
      "Water appears to be leaking from beneath a drinking fountain and pooling on the surrounding floor, creating a possible slip hazard.",
    evidence: ["Water beneath the fountain", "Pooling on the adjacent floor"],
    hazards: ["Possible slip hazard"],
    severity: "urgent",
    object: "Drinking fountain",
  },
  {
    id: "outlet",
    label: "Broken electrical outlet",
    category: "electrical",
    title: "Electrical outlet with active sparking",
    summary:
      "Active electrical sparking is reported at a damaged outlet. Keep away from the outlet and contact emergency services if anyone is in immediate danger.",
    evidence: ["Damaged outlet cover", "Active electrical sparking"],
    hazards: ["Potential electrical and fire hazard"],
    severity: "emergency",
    object: "Electrical outlet",
  },
  {
    id: "chair",
    label: "Broken classroom chair",
    category: "furniture",
    title: "Damaged classroom chair",
    summary:
      "A classroom chair appears to have a damaged support and should be inspected before further use.",
    evidence: ["Damaged chair support"],
    hazards: ["Possible fall risk"],
    severity: "routine",
    object: "Classroom chair",
  },
  {
    id: "wifi",
    label: "Wi-Fi outage",
    category: "network",
    title: "Wi-Fi unavailable on second floor",
    summary:
      "Campus Wi-Fi is reported unavailable across the second floor. OIT should investigate connectivity in the affected area.",
    evidence: ["User reports loss of connectivity"],
    hazards: [],
    severity: "priority",
    object: "Campus Wi-Fi",
  },
] as const;
export function demoAnalysis(id: string): Analysis {
  const s = scenarios.find((s) => s.id === id);
  if (!s) throw new Error("Unknown demo scenario");
  return analysisSchema.parse({
    issueTitle: s.title,
    detectedObject: s.object,
    category: s.category,
    subcategory: s.object,
    summary: s.summary,
    visibleEvidence: [...s.evidence],
    hazards: [...s.hazards],
    severity: s.severity,
    severityReason: "Assessment from a fictional demonstration scenario.",
    confidence: 0.94,
    missingInformation: ["location"],
    clarifyingQuestions: ["Which building, floor, and room is this in?"],
    suggestedDepartment: s.category === "network" ? "OIT" : "Facilities",
    routingReason: "Pending location context.",
    immediateSafetyMessage: null,
  });
}
