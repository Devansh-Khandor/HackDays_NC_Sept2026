import { randomUUID } from "node:crypto";
import { demoAnalysis } from "./scenarios";
import { routeIncident } from "@/lib/routing/routingEngine";
import type { Incident, Status } from "@/lib/incidents/schema";
export function seedData(): Incident[] {
  const rows = [
    [
      "chair",
      "Damaged classroom chair",
      "Withers Hall",
      "routine",
      1,
      "reported",
    ],
    [
      "fountain",
      "Water leak in parking deck",
      "Dan Allen Parking Deck",
      "urgent",
      5,
      "acknowledged",
    ],
    [
      "chair",
      "Light fixture not working",
      "Hunt Library",
      "routine",
      2,
      "assigned",
    ],
    [
      "wifi",
      "Wi-Fi unavailable on second floor",
      "Engineering Building II",
      "priority",
      8,
      "in_progress",
    ],
    [
      "chair",
      "Elevator 2 not operating",
      "Talley Student Union",
      "priority",
      12,
      "acknowledged",
    ],
  ] as const;
  return rows.map((r, i) => {
    const location = {
      building: r[2],
      floor: "2",
      room: "",
      locationDescription: i === 4 ? "East-side elevator lobby" : "",
      coordinates: null,
    };
    const a = demoAnalysis(r[0]);
    if (i === 2)
      Object.assign(a, {
        category: "electrical",
        detectedObject: "Light fixture",
        summary:
          "A ceiling light fixture is reported not working near the second-floor study area.",
        visibleEvidence: ["Light reported not illuminating"],
        hazards: [],
      });
    if (i === 4)
      Object.assign(a, {
        category: "elevator",
        detectedObject: "Elevator 2",
        summary:
          "The east-side elevator is reported out of service. No entrapment has been reported.",
        visibleEvidence: ["Elevator reported not responding"],
        hazards: ["Possible accessibility impact"],
      });
    if (i === 1)
      Object.assign(a, {
        summary:
          "Water is reported pooling along the second level of the parking deck.",
        visibleEvidence: ["Pooling water reported in parking deck"],
      });
    const createdAt = new Date(
      Date.now() - (i + 1) * 1000 * 60 * 37,
    ).toISOString();
    const status = r[5] as Status;
    return {
      id: randomUUID(),
      displayId: `CF-${1021 + i}`,
      analysis: routeIncident(
        {
          ...a,
          issueTitle: r[1],
          severity: r[3],
          missingInformation: [],
          clarifyingQuestions: [],
        },
        location,
      ),
      location,
      image: null,
      mode: "demo",
      department: routeIncident(a, location).suggestedDepartment,
      status,
      confirmations: r[4],
      confirmationKeys: [],
      submissionKey: randomUUID(),
      assignedTo: null,
      createdAt,
      updatedAt: createdAt,
      timeline:
        status === "reported"
          ? [{ status: "reported", at: createdAt }]
          : [
              { status: "reported", at: createdAt },
              { status, at: createdAt },
            ],
      seeded: true,
    };
  });
}
