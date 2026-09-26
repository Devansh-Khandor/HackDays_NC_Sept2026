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
  type Draft,
} from "@/lib/incidents/schema";
import { routeIncident } from "@/lib/routing/routingEngine";
import { applySafetyRules, emergencyMessage } from "@/lib/safety/safetyRules";
import { JsonIncidentRepository } from "@/lib/incidents/jsonRepository";
import {
  duplicateCandidates,
  detectDuplicate,
} from "@/lib/gemini/duplicateDetection";
const location = {
  ...emptyLocation,
  building: "Engineering Building II",
  floor: "2",
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
  it("accepts a usable landmark without building", () =>
    expect(
      submissionSchema.safeParse({
        ...draft,
        location: {
          ...emptyLocation,
          locationDescription: "Outside Hunt Library main entrance",
        },
        userApproved: true,
        submissionKey: randomUUID(),
      }).success,
    ).toBe(true));
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
