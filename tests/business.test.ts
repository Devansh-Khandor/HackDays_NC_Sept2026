import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { demoAnalysis } from "@/lib/demo/scenarios";
import {
  analysisSchema,
  submissionSchema,
  emptyLocation,
  locationSchema,
  type Draft,
} from "@/lib/incidents/schema";
import { routeIncident } from "@/lib/routing/routingEngine";
import { applySafetyRules, emergencyMessage } from "@/lib/safety/safetyRules";
import { JsonIncidentRepository } from "@/lib/incidents/jsonRepository";
import {
  duplicateCandidates,
  detectDuplicate,
} from "@/lib/gemini/duplicateDetection";
import {
  confidentBuilding,
  nearbyBuildings,
} from "@/lib/campus/nearestBuilding";
const location = {
  ...emptyLocation,
  building: "Engineering Building II",
  floor: "2",
  room: "2201",
};
const draft: Draft = {
  analysis: demoAnalysis("fountain"),
  location,
  image: null,
  mode: "demo",
};
const dirs: string[] = [];
async function repo() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "campusfix-test-"));
  dirs.push(dir);
  return new JsonIncidentRepository(path.join(dir, "incidents.json"), false);
}
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })),
  );
});
describe("routing rules", () => {
  it("routes general plumbing to facilities", () =>
    expect(routeIncident(draft.analysis, location).suggestedDepartment).toBe(
      "Facilities",
    ));
  it("routes housing plumbing to Housing", () =>
    expect(
      routeIncident(draft.analysis, {
        ...location,
        building: "A residence hall",
      }).suggestedDepartment,
    ).toBe("University Housing"));
  it("routes housing network incidents to OIT first", () =>
    expect(
      routeIncident(demoAnalysis("wifi"), {
        ...location,
        building: "Residence hall",
      }).suggestedDepartment,
    ).toBe("OIT"));
  it("routes parking infrastructure to Transportation", () =>
    expect(
      routeIncident(draft.analysis, {
        ...location,
        building: "Dan Allen Parking Deck",
      }).suggestedDepartment,
    ).toBe("Transportation"));
  it("falls back for uncertain issues", () =>
    expect(
      routeIncident({ ...draft.analysis, confidence: 0.2 }, location)
        .suggestedDepartment,
    ).toBe("CampusFix Review"));
});
describe("safety safeguards", () => {
  it.each([
    "Visible fire in the room",
    "Heavy smoke near the ceiling",
    "The outlet is sparking",
    "Major uncontrolled flooding",
    "Suspected structural collapse",
    "Immediate danger to a person",
  ])("escalates %s independently of model severity", (text) => {
    const a = applySafetyRules(
      { ...draft.analysis, severity: "routine" },
      text,
    );
    expect(a.severity).toBe("emergency");
    expect(a.immediateSafetyMessage).toBe(emergencyMessage);
  });
  it("does not escalate a routine chair repair", () =>
    expect(applySafetyRules(demoAnalysis("chair")).severity).toBe("routine"));
  it("preserves Gemini emergency decisions", () =>
    expect(
      applySafetyRules({ ...draft.analysis, severity: "emergency" })
        .immediateSafetyMessage,
    ).toBe(emergencyMessage));
});
describe("validation", () => {
  it("rejects missing approval", () =>
    expect(
      submissionSchema.safeParse({ ...draft, submissionKey: randomUUID() })
        .success,
    ).toBe(false));
  it("rejects missing location", () =>
    expect(
      submissionSchema.safeParse({
        ...draft,
        location: emptyLocation,
        userApproved: true,
        submissionKey: randomUUID(),
      }).success,
    ).toBe(false));
  it("requires building, floor, and room", () => {
    const submit = (l: Partial<typeof location>) =>
      submissionSchema.safeParse({
        ...draft,
        location: { ...location, ...l },
        userApproved: true,
        submissionKey: randomUUID(),
      }).success;
    expect(submit({})).toBe(true);
    expect(submit({ floor: "" })).toBe(false);
    expect(submit({ room: " " })).toBe(false);
    expect(
      submit({
        building: "",
        locationDescription: "Outside Hunt Library main entrance",
      }),
    ).toBe(false);
  });
  it("accepts precise GPS in place of a building, still needing floor and room", () => {
    const gps = (accuracy: number) => ({
      latitude: 35.772,
      longitude: -78.674,
      accuracy,
      capturedAt: new Date().toISOString(),
    });
    const submit = (l: Partial<typeof location>) =>
      submissionSchema.safeParse({
        ...draft,
        location: { ...location, building: "", ...l },
        userApproved: true,
        submissionKey: randomUUID(),
      }).success;
    expect(submit({ coordinates: gps(15) })).toBe(true);
    expect(submit({ coordinates: gps(15), room: "" })).toBe(false);
    expect(submit({ coordinates: gps(2000) })).toBe(false);
    expect(submit({})).toBe(false);
  });
  it("defaults coordinates for incidents stored before GPS existed", () => {
    const legacy = { ...location, coordinates: undefined };
    expect(locationSchema.parse(legacy).coordinates).toBeNull();
    expect(
      locationSchema.safeParse({
        ...legacy,
        coordinates: {
          latitude: 200,
          longitude: 0,
          accuracy: 5,
          capturedAt: new Date().toISOString(),
        },
      }).success,
    ).toBe(false);
  });
  it("rejects invalid confidence and unknown departments", () => {
    expect(
      analysisSchema.safeParse({ ...draft.analysis, confidence: 1.5 }).success,
    ).toBe(false);
    expect(
      analysisSchema.safeParse({
        ...draft.analysis,
        suggestedDepartment: "Imaginary Services",
      }).success,
    ).toBe(false);
  });
  it("rejects arbitrary image paths", () =>
    expect(
      submissionSchema.safeParse({
        ...draft,
        image: "/etc/passwd",
        userApproved: true,
        submissionKey: randomUUID(),
      }).success,
    ).toBe(false));
});
describe("persistent repository", () => {
  it("creates, reads, updates and retains data across instances", async () => {
    const r = await repo();
    const row = await r.createIncident(draft, randomUUID());
    expect((await r.getIncident(row.id))?.analysis.issueTitle).toBe(
      draft.analysis.issueTitle,
    );
    await r.updateStatus(row.id, "acknowledged");
    await r.updateStatus(row.id, "assigned");
    await r.updateStatus(row.id, "in_progress");
    await r.updateStatus(row.id, "resolved");
    const again = new JsonIncidentRepository(
      path.join(dirs[0], "incidents.json"),
      false,
    );
    expect((await again.getIncident(row.id))?.timeline).toHaveLength(5);
    expect(await again.getOpenIncidents()).toHaveLength(0);
  });
  it("is idempotent on retried submission", async () => {
    const r = await repo();
    const key = randomUUID();
    const [a, b] = await Promise.all([
      r.createIncident(draft, key),
      r.createIncident(draft, key),
    ]);
    expect(a.id).toBe(b.id);
    expect(await r.getIncidents()).toHaveLength(1);
  });
  it("does not lose concurrent confirmations or count retried confirmation twice", async () => {
    const r = await repo();
    const row = await r.createIncident(draft, randomUUID());
    const key = randomUUID();
    await Promise.all([
      r.addConfirmation(row.id, key),
      r.addConfirmation(row.id, key),
      ...Array.from({ length: 8 }, () =>
        r.addConfirmation(row.id, randomUUID()),
      ),
    ]);
    expect((await r.getIncident(row.id))?.confirmations).toBe(9);
    expect(await r.getIncidents()).toHaveLength(1);
  });
  it("rejects missing incidents and invalid status transitions", async () => {
    const r = await repo();
    expect(await r.getIncident(randomUUID())).toBeNull();
    const row = await r.createIncident(draft, randomUUID());
    await expect(r.updateStatus(row.id, "resolved")).rejects.toThrow(
      "INVALID_TRANSITION",
    );
    await expect(r.addConfirmation(randomUUID(), randomUUID())).rejects.toThrow(
      "NOT_FOUND",
    );
  });
  it("restricts duplicates to matching open building/category candidates", async () => {
    const r = await repo();
    const row = await r.createIncident(draft, randomUUID());
    expect(duplicateCandidates(draft, [row])).toHaveLength(1);
    expect(
      duplicateCandidates(
        { ...draft, location: { ...location, building: "Hunt Library" } },
        [row],
      ),
    ).toHaveLength(0);
    expect(
      duplicateCandidates(draft, [{ ...row, status: "resolved" }]),
    ).toHaveLength(0);
    expect((await detectDuplicate(draft, [row]))?.incident.id).toBe(row.id);
    expect(
      await detectDuplicate(
        { ...draft, location: { ...location, floor: "5" } },
        [row],
      ),
    ).toBeNull();
  });
});
describe("campus building lookup", () => {
  const fix = (latitude: number, longitude: number, accuracy = 15) => ({
    latitude,
    longitude,
    accuracy,
    capturedAt: new Date().toISOString(),
  });
  it("picks the building when the fix is clearly inside one", () => {
    expect(confidentBuilding(fix(35.772, -78.6738))?.name).toBe(
      "Koch Hall (Engineering Building II)",
    );
    expect(confidentBuilding(fix(35.784, -78.6708))?.name).toBe(
      "Talley Student Union",
    );
  });
  it("offers choices instead of guessing between neighbouring buildings", () => {
    const between = fix(35.7718, -78.6746);
    const names = nearbyBuildings(between).map((m) => m.building.name);
    expect(confidentBuilding(between)).toBeNull();
    expect(names).toContain("Koch Hall (Engineering Building II)");
    expect(names).toContain("Engineering Building I (EB1)");
    expect(names.length).toBeLessThanOrEqual(4);
  });
  it("does not auto-pick from an imprecise fix", () =>
    expect(confidentBuilding(fix(35.772, -78.6738, 400))).toBeNull());
  it("does not auto-pick a lone building that is not close", () => {
    const [only] = nearbyBuildings(fix(35.788547, -78.684305, 60));
    expect(only).toBeDefined();
    expect(only.distance).toBeGreaterThan(15);
    expect(confidentBuilding(fix(35.788547, -78.684305, 60))).toBeNull();
  });
  it("returns nothing when no building is close enough", () => {
    expect(nearbyBuildings(fix(35.9, -78.9))).toEqual([]);
    expect(nearbyBuildings(fix(35.9, -78.9, 5000))).toEqual([]);
  });
});
