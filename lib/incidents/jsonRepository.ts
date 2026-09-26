import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { incidentSchema, type Draft, type Incident } from "./schema";
import type { IncidentRepository } from "./repository";
import { applyAction, type Actor, type IncidentAction } from "./workflow";
import { seedData } from "@/lib/demo/seedData";
// Serialize every read-modify-write, including initial seeding. Atomic rename avoids partial JSON.
const processState = globalThis as typeof globalThis & {
  campusfixWriteQueues?: Map<string, Promise<unknown>>;
};
// Share the queue across Next.js route bundles and development reloads.
const queues = (processState.campusfixWriteQueues ??= new Map<
  string,
  Promise<unknown>
>());
export class JsonIncidentRepository implements IncidentRepository {
  constructor(
    private file = path.join(process.cwd(), "data", "incidents.json"),
    private seed = true,
  ) {}
  private async read(): Promise<Incident[]> {
    try {
      return z
        .array(incidentSchema)
        .parse(JSON.parse(await readFile(this.file, "utf8")));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      const rows = this.seed ? seedData() : [];
      await this.save(rows);
      return rows;
    }
  }
  private async save(rows: Incident[]) {
    await mkdir(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(rows, null, 2), "utf8");
    await rename(temp, this.file);
  }
  private locked<T>(fn: () => Promise<T>): Promise<T> {
    const next = (queues.get(this.file) ?? Promise.resolve()).then(fn);
    queues.set(
      this.file,
      next.catch(() => {}),
    );
    return next;
  }
  getIncidents() {
    return this.locked(async () =>
      (await this.read()).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  }
  async getIncident(id: string) {
    return (await this.getIncidents()).find((i) => i.id === id) ?? null;
  }
  async getOpenIncidents() {
    return (await this.getIncidents()).filter((i) => i.status !== "resolved");
  }
  createIncident(draft: Draft, submissionKey: string) {
    return this.locked(async () => {
      const rows = await this.read();
      const existing = rows.find((r) => r.submissionKey === submissionKey);
      if (existing) return existing;
      const now = new Date().toISOString();
      const next =
        Math.max(1025, ...rows.map((r) => Number(r.displayId.slice(3)) || 0)) +
        1;
      const incident = incidentSchema.parse({
        ...draft,
        id: randomUUID(),
        displayId: `CF-${next}`,
        department: draft.analysis.suggestedDepartment,
        status: "reported",
        confirmations: 0,
        confirmationKeys: [],
        submissionKey,
        assignedTo: null,
        createdAt: now,
        updatedAt: now,
        timeline: [{ status: "reported", at: now }],
        seeded: false,
      });
      rows.push(incident);
      await this.save(rows);
      return incident;
    });
  }
  private mutate(id: string, fn: (incident: Incident) => Incident | void) {
    return this.locked(async () => {
      const rows = await this.read();
      const index = rows.findIndex((r) => r.id === id);
      if (index < 0) throw new Error("NOT_FOUND");
      const row = fn(rows[index]) ?? rows[index];
      row.updatedAt = new Date().toISOString();
      rows[index] = row;
      await this.save(rows);
      return row;
    });
  }
  addConfirmation(id: string, key: string) {
    return this.mutate(id, (i) => {
      if (i.status === "resolved") throw new Error("ALREADY_RESOLVED");
      if (!i.confirmationKeys.includes(key)) {
        i.confirmations++;
        i.confirmationKeys.push(key);
      }
    });
  }
  applyAction(id: string, action: IncidentAction, actor: Actor) {
    return this.mutate(id, (i) => applyAction(i, action, actor));
  }
}
