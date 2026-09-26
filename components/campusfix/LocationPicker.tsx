"use client";
import { useState } from "react";
import { Crosshair, LoaderCircle, X } from "lucide-react";
import {
  MAX_USABLE_ACCURACY_METERS,
  type Coordinates,
} from "@/lib/incidents/schema";
import { mapUrl } from "@/lib/incidents/geo";
import {
  confidentBuilding,
  nearbyBuildings,
} from "@/lib/campus/nearestBuilding";
import { campusBuildings } from "@/lib/campus/buildings";
export const CAMPUS_BUILDINGS_LIST = "campus-buildings";
// Autocomplete for typed building names.
export function CampusBuildingOptions() {
  return (
    <datalist id={CAMPUS_BUILDINGS_LIST}>
      {campusBuildings.map((b) => (
        <option key={b.name} value={b.name} />
      ))}
    </datalist>
  );
}
const geolocationErrors: Record<number, string> = {
  1: "Location access was blocked. Allow location for this site in your browser settings, or type the building below.",
  2: "Your device could not determine a location. Try again near a window or type the building below.",
  3: "Finding your location took too long. Try again or type the building below.",
};
function currentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext)
      return reject(
        new Error(
          "Location needs a secure (HTTPS) connection. Open CampusFix over HTTPS or localhost, or type the building below.",
        ),
      );
    if (!("geolocation" in navigator))
      return reject(
        new Error("This browser does not support location access."),
      );
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
          capturedAt: new Date(p.timestamp).toISOString(),
        }),
      (e) =>
        reject(
          new Error(geolocationErrors[e.code] ?? "Location is unavailable."),
        ),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  });
}
// Finds the campus building the device is in, or offers nearby ones to choose from.
export function LocationPicker({
  value,
  building,
  onLocate,
  onPick,
  onClear,
}: {
  value: Coordinates | null;
  building: string;
  onLocate: (coordinates: Coordinates, building: string | null) => void;
  onPick: (building: string) => void;
  onClear: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const nearby = value ? nearbyBuildings(value) : [];
  const picked = nearby.some((m) => m.building.name === building);
  const imprecise =
    value !== null && value.accuracy > MAX_USABLE_ACCURACY_METERS;
  async function locate() {
    setBusy(true);
    setError("");
    try {
      const coordinates = await currentPosition();
      onLocate(coordinates, confidentBuilding(coordinates)?.name ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="location-picker">
      {value ? (
        <div className="gps-chip">
          <Crosshair size={15} />
          Location added
          <span>±{Math.round(value.accuracy)} m</span>
          <a href={mapUrl(value)} target="_blank" rel="noreferrer">
            View map
          </a>
          <button
            type="button"
            aria-label="Remove device location"
            onClick={onClear}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="small-button"
          disabled={busy}
          onClick={locate}
        >
          {busy ? (
            <LoaderCircle size={15} className="spin" />
          ) : (
            <Crosshair size={15} />
          )}
          {busy ? "Finding your building…" : "Use my current location"}
        </button>
      )}
      {(nearby.length > 1 || (nearby.length === 1 && !picked)) && (
        <div className="building-suggestions">
          <p className="location-hint">
            {picked ? "Nearby buildings:" : "Which building are you in?"}
          </p>
          <div role="group" aria-label="Nearby buildings">
            {nearby.map(({ building: b }) => (
              <button
                type="button"
                key={b.name}
                className={b.name === building ? "selected" : ""}
                aria-pressed={b.name === building}
                onClick={() => onPick(b.name)}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {imprecise ? (
        <p className="location-hint">
          Your location is only accurate to ±{Math.round(value.accuracy)} m,
          which is not enough on its own. Pick or type the building.
        </p>
      ) : (
        value &&
        nearby.length === 0 && (
          <p className="location-hint">
            No campus building matched. Your GPS location will be sent with the
            report; add the building if you know it.
          </p>
        )
      )}
      {error && (
        <p className="location-hint error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
