import type { Coordinates } from "@/lib/incidents/schema";
import { campusBuildings, type CampusBuilding } from "./buildings";
const METERS_PER_DEGREE_LAT = 111_320;
// Indoor GPS drifts; allow a small margin even for a confident fix.
const MIN_MATCH_METERS = 30;
const MAX_MATCH_METERS = 120;
// Auto-pick only when the fix is at (or just outside) one building and clear of the next.
const CONFIDENT_MAX_METERS = 15;
const CLEAR_WINNER_METERS = 20;
const MAX_SUGGESTIONS = 4;
// Meters from a point to a building's bounding box (0 when inside it).
function distanceToBox(
  { latitude, longitude }: Coordinates,
  [south, west, north, east]: CampusBuilding["bounds"],
) {
  const metersPerDegreeLon =
    METERS_PER_DEGREE_LAT * Math.cos((latitude * Math.PI) / 180);
  const dLat = Math.max(south - latitude, 0, latitude - north);
  const dLon = Math.max(west - longitude, 0, longitude - east);
  return Math.hypot(dLat * METERS_PER_DEGREE_LAT, dLon * metersPerDegreeLon);
}
function distanceToCenter(
  c: Coordinates,
  [s, w, n, e]: CampusBuilding["bounds"],
) {
  return distanceToBox(c, [(s + n) / 2, (w + e) / 2, (s + n) / 2, (w + e) / 2]);
}
// Buildings the fix could plausibly be in, closest first.
export function nearbyBuildings(c: Coordinates) {
  const limit = Math.min(
    Math.max(c.accuracy, MIN_MATCH_METERS),
    MAX_MATCH_METERS,
  );
  return campusBuildings
    .map((building) => ({
      building,
      distance: distanceToBox(c, building.bounds),
      // Bounding boxes overlap for neighbours; break ties by distance to center.
      center: distanceToCenter(c, building.bounds),
    }))
    .filter((m) => m.distance <= limit)
    .sort((a, b) => a.distance - b.distance || a.center - b.center)
    .slice(0, MAX_SUGGESTIONS);
}
// The single building the fix is in, or null when the user should choose.
export function confidentBuilding(c: Coordinates): CampusBuilding | null {
  if (c.accuracy > MAX_MATCH_METERS) return null;
  const [best, next] = nearbyBuildings(c);
  if (!best || best.distance > CONFIDENT_MAX_METERS) return null;
  return !next || next.distance - best.distance > CLEAR_WINNER_METERS
    ? best.building
    : null;
}
