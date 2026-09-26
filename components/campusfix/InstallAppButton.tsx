"use client";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallAppButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !("MSStream" in window)
    );
    setHidden(false);

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstallEvent(null);
      setHidden(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || (!installEvent && !isIOS)) return null;

  async function handleClick() {
    if (installEvent) {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") setInstallEvent(null);
      return;
    }
    setShowIosHint(true);
  }

  return (
    <div className="install-app">
      <button type="button" className="small-button" onClick={handleClick}>
        <Download size={14} />
        Install App
      </button>
      {showIosHint && (
        <div className="install-ios-hint" role="dialog" aria-label="Install instructions">
          <button
            type="button"
            className="install-ios-hint-close"
            onClick={() => setShowIosHint(false)}
            aria-label="Close"
          >
            <X size={14} />
          </button>
          <p>
            Tap the Share button <Share size={13} style={{ verticalAlign: "-2px" }} />{" "}
            in Safari, then choose <strong>Add to Home Screen</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
