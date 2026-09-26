import type { Analysis, Location, Department } from "@/lib/incidents/schema";
export function routeIncident(a: Analysis, l: Location): Analysis {
  let department: Department = "Facilities";
  let reason =
    "General campus infrastructure and maintenance are handled by Facilities.";
  const where = `${l.building} ${l.locationDescription}`;
  if (["network", "technology"].includes(a.category)) {
    department = "OIT";
    reason =
      "Network and technology issues belong with the NC State Help Desk, including issues in residence halls.";
  } else if (
    a.category === "parking" ||
    /parking (deck|lot|garage)/i.test(where)
  ) {
    department = "Transportation";
    reason = "The issue concerns parking facilities or their infrastructure.";
  } else if (
    /residence hall|\bdorm\b|university housing|student apartment/i.test(where)
  ) {
    department = "University Housing";
    reason = "The provided location identifies university housing maintenance.";
  } else if (a.category === "other" || a.confidence < 0.5) {
    department = "CampusFix Review";
    reason =
      "The destination is uncertain; a CampusFix operator should review it.";
  }
  return { ...a, suggestedDepartment: department, routingReason: reason };
}
