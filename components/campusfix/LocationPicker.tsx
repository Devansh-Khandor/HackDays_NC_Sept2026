"use client";
import { useState } from "react";
import { Crosshair, LoaderCircle, X } from "lucide-react";
import {
  MAX_USABLE_ACCURACY_METERS,
  type Coordinates,
} from "@/lib/incidents/schema";
import { formatCoordinates, mapUrl } from "@/lib/incidents/geo";
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
export function LocationPicker({
  value,
  onChange,
}: {
  value: Coordinates | null;
  onChange: (c: Coordinates | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function locate() {
    setBusy(true);
    setError("");
    try {
      onChange(await currentPosition());
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
          <a href={mapUrl(value)} target="_blank" rel="noreferrer">
            {formatCoordinates(value)}
          </a>
          <button
            type="button"
            aria-label="Remove device location"
            onClick={() => onChange(null)}
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
          {busy ? "Finding you…" : "Use my current location"}
        </button>
      )}
      {value && value.accuracy > MAX_USABLE_ACCURACY_METERS && (
        <p className="location-hint">
          This fix is imprecise. Add the building so crews can find it.
        </p>
      )}
      {error && (
        <p className="location-hint error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
