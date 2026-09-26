"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, RefreshCw, X } from "lucide-react";
// Webcam capture for browsers without a native camera picker (desktop/laptop).
export function CameraCapture({
  onCapture,
  onClose,
  onUnavailable,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
  onUnavailable: (message: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [ready, setReady] = useState(false);
  const [canFlip, setCanFlip] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) return media.getTracks().forEach((t) => t.stop());
        stream.current = media;
        if (video.current) video.current.srcObject = media;
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled)
          setCanFlip(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch (e) {
        if (cancelled) return;
        const name = (e as DOMException).name;
        onUnavailable(
          name === "NotAllowedError"
            ? "Camera access was blocked. Allow the camera for this site, or upload a photo instead."
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "No camera was found on this device. Upload a photo instead."
              : "The camera could not start. Close other apps using it, or upload a photo instead.",
        );
      }
    })();
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      setReady(false);
    };
  }, [facing, onUnavailable]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  function capture() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(
          new File([blob], `campus-photo-${Date.now()}.jpg`, {
            type: "image/jpeg",
          }),
        );
      },
      "image/jpeg",
      0.88,
    );
  }
  // Portal out of the animated form so `position: fixed` covers the viewport.
  return createPortal(
    <div
      className="camera-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Take a photo"
    >
      <div className="camera-sheet">
        <video
          ref={video}
          autoPlay
          playsInline
          muted
          onLoadedData={() => setReady(true)}
          className={facing === "user" ? "mirrored" : ""}
        />
        {!ready && <p className="camera-status">Starting camera…</p>}
        <div className="camera-controls">
          <button
            type="button"
            className="camera-icon-button"
            aria-label="Close camera"
            onClick={onClose}
          >
            <X size={20} />
          </button>
          <button
            type="button"
            className="shutter"
            aria-label="Capture photo"
            disabled={!ready}
            onClick={capture}
          >
            <Camera size={24} />
          </button>
          <button
            type="button"
            className="camera-icon-button"
            aria-label="Switch camera"
            disabled={!canFlip}
            onClick={() =>
              setFacing((f) => (f === "user" ? "environment" : "user"))
            }
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
