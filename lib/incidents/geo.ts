import type { Coordinates } from "./schema";
export const mapUrl = (c: Coordinates) =>
  `https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=19/${c.latitude}/${c.longitude}`;
export const formatCoordinates = (c: Coordinates) =>
  `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)} (±${Math.round(c.accuracy)} m)`;
