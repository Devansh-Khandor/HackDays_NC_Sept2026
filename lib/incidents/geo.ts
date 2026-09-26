import type { Coordinates } from "./schema";
export const mapUrl = (c: Coordinates) =>
  `https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=19/${c.latitude}/${c.longitude}`;
