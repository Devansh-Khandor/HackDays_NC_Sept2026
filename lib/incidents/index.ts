import "server-only";
import { JsonIncidentRepository } from "./jsonRepository";
import type { IncidentRepository } from "./repository";
let repository: IncidentRepository;
export function getRepository() {
  if (process.env.DATA_BACKEND && process.env.DATA_BACKEND !== "json")
    throw new Error("Unsupported data backend. Use DATA_BACKEND=json.");
  return (repository ??= new JsonIncidentRepository());
}
