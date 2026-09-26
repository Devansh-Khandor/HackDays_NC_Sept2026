"use client";
import { useCallback, useRef, useState } from "react";
import {
  Camera,
  Upload,
  ArrowRight,
  MapPin,
  Sparkles,
  X,
  Droplets,
  Zap,
  Armchair,
  Wifi,
  FlaskConical,
} from "lucide-react";
import { scenarios } from "@/lib/demo/scenarios";
import { emptyLocation, type Location } from "@/lib/incidents/schema";
import { ErrorMessage } from "./Shared";
import { CameraCapture } from "./CameraCapture";
import { LocationPicker } from "./LocationPicker";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Phone cameras routinely exceed the upload limit; re-encode those as a smaller JPEG.
async function shrinkImage(file: File, maxEdge = 2560): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob(r, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("Could not process image");
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
    type: "image/jpeg",
  });
}
export function IncidentCapture({
  demo,
  onDemoChange,
  onAnalyze,
}: {
  demo: boolean;
  onDemoChange: (v: boolean) => void;
  onAnalyze: (form: FormData) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<Location>(emptyLocation);
  const [scenario, setScenario] = useState("fountain");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  async function select(f?: File) {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      try {
        f = await shrinkImage(f);
      } catch {
        f = undefined;
      }
      if (!f || f.size > MAX_IMAGE_BYTES) {
        setError("Please choose an image smaller than 5 MB.");
        return;
      }
    }
    setError("");
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }
  function takePhoto() {
    // Phones get the native camera app; desktops without one get a live webcam view.
    const phone = window.matchMedia("(pointer: coarse)").matches;
    if (!phone && window.isSecureContext && "mediaDevices" in navigator)
      setCameraOpen(true);
    else cameraInput.current?.click();
  }
  const cameraUnavailable = useCallback((message: string) => {
    setCameraOpen(false);
    setError(message);
  }, []);
  const closeCamera = useCallback(() => setCameraOpen(false), []);
  function submit() {
    const form = new FormData();
    form.set("mode", demo ? "demo" : "live");
    form.set("scenario", scenario);
    form.set("description", description);
    const { coordinates, ...place } = location;
    for (const [key, value] of Object.entries(place)) form.set(key, value);
    if (coordinates) form.set("coordinates", JSON.stringify(coordinates));
    if (file) form.set("image", file);
    onAnalyze(form);
  }
  const icons = [Droplets, Zap, Armchair, Wifi];
  return (
    <>
      <div className="capture-heading">
        <div>
          <span className="eyebrow">A better campus starts with you</span>
          <h2>What&apos;s wrong on campus?</h2>
          <p>A photo is all it takes to get started.</p>
        </div>
        <span className="step-number">01</span>
      </div>
      <div className="mode-switch">
        <button
          className={!demo ? "selected" : ""}
          onClick={() => onDemoChange(false)}
        >
          <Camera size={16} /> Your report
        </button>
        <button
          className={demo ? "selected" : ""}
          onClick={() => onDemoChange(true)}
        >
          <FlaskConical size={16} /> Try Demo
        </button>
      </div>
      {demo ? (
        <div className="demo-area">
          <div className="demo-label">
            <FlaskConical size={16} />
            <strong>Demo Mode</strong>
            <span>Fictional scenarios · no API call</span>
          </div>
          <div className="scenario-grid">
            {scenarios.map((s, i) => {
              const Icon = icons[i];
              return (
                <button
                  key={s.id}
                  className={scenario === s.id ? "selected" : ""}
                  onClick={() => setScenario(s.id)}
                >
                  <Icon size={24} />
                  <span>{s.label}</span>
                  <span className="radio-dot" />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className={`upload-zone ${drag ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            select(e.dataTransfer.files[0]);
          }}
        >
          <input
            aria-label="Upload issue photo"
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => select(e.target.files?.[0])}
          />
          {preview ? (
            <>
              <img src={preview} alt="Preview of your campus issue" />
              <button
                className="remove-image"
                aria-label="Remove image"
                onClick={() => {
                  setFile(null);
                  setPreview("");
                  URL.revokeObjectURL(preview);
                  if (input.current) input.current.value = "";
                }}
              >
                <X size={18} />
              </button>
              <span className="image-name">{file?.name}</span>
            </>
          ) : (
            <>
              <div className="upload-icon">
                <Camera size={27} />
                <span>+</span>
              </div>
              <h3>Show us the problem</h3>
              <p>
                Drop a photo here, or{" "}
                <button
                  className="text-button"
                  onClick={() => input.current?.click()}
                >
                  browse files
                </button>
              </p>
              <span className="upload-help">JPG, PNG or WebP · Up to 5 MB</span>
              <div className="upload-actions">
                <button
                  className="small-button"
                  onClick={() => input.current?.click()}
                >
                  <Upload size={15} />
                  Upload photo
                </button>
                <button className="small-button" onClick={takePhoto}>
                  <Camera size={15} />
                  Take photo
                </button>
                <input
                  aria-label="Take issue photo"
                  ref={cameraInput}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={(e) => select(e.target.files?.[0])}
                />
              </div>
            </>
          )}
        </div>
      )}
      <label className="field">
        What did you notice? <span>Optional</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={3000}
          placeholder="There is water leaking underneath this fountain."
          rows={2}
        />
      </label>
      <LocationPicker
        value={location.coordinates}
        onChange={(coordinates) => setLocation((l) => ({ ...l, coordinates }))}
      />
      <details className="location-input">
        <summary>
          <MapPin size={17} />
          Add building &amp; room <span>Optional for now</span>
          <span className="plus">+</span>
        </summary>
        <div className="location-fields">
          {(["building", "floor", "room"] as const).map((k) => (
            <label className="field" key={k}>
              {k === "room" ? "Room / landmark" : k}
              <input
                value={location[k]}
                onChange={(e) =>
                  setLocation({ ...location, [k]: e.target.value })
                }
                maxLength={250}
                placeholder={
                  k === "building"
                    ? "e.g. Engineering Building II"
                    : k === "floor"
                      ? "e.g. 2"
                      : "e.g. Near 2201"
                }
              />
            </label>
          ))}
        </div>
      </details>
      <ErrorMessage message={error} />
      <button
        className="button primary wide"
        disabled={!demo && !file && !description.trim()}
        onClick={submit}
      >
        <Sparkles size={19} />
        {demo ? "Explore demo scenario" : "Analyze with Gemini"}
        <ArrowRight size={18} />
      </button>
      <p className="privacy-note">
        You review every detail before anything is submitted.
      </p>
      {cameraOpen && (
        <CameraCapture
          onCapture={(f) => {
            setCameraOpen(false);
            select(f);
          }}
          onClose={closeCamera}
          onUnavailable={cameraUnavailable}
        />
      )}
    </>
  );
}
