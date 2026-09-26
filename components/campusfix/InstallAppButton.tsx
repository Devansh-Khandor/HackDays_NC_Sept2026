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
  const [isIOSNonSafari, setIsIOSNonSafari] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const ua = navigator.userAgent;
    const onIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const onAndroid = /Android/.test(ua);
    // Desktop already surfaces install via the browser's own UI (address-bar
    // icon, menu item); the in-page button only earns its space on phones.
    if (!onIOS && !onAndroid) return;

    setIsIOS(onIOS);
    // Every iOS browser is required by Apple to use Safari's engine, but only
    // Safari itself can install the manifest as a real standalone app —
    // Chrome/Firefox/Edge on iOS report their own token here (CriOS/FxiOS/EdgiOS)
    // even though they're Safari under the hood.
    setIsIOSNonSafari(onIOS && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua));
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
      <button
        type="button"
        className="small-button icon-only"
        onClick={handleClick}
        aria-label="Install App"
        title="Install App"
      >
        <Download size={16} />
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
            {isIOSNonSafari ? (
              <>
                iPhone only allows installing apps from{" "}
                <strong>Safari</strong> — open this page in Safari, then tap
                the Share button{" "}
                <Share size={13} style={{ verticalAlign: "-2px" }} /> and
                choose <strong>Add to Home Screen</strong>.
              </>
            ) : (
              <>
                Tap the Share button{" "}
                <Share size={13} style={{ verticalAlign: "-2px" }} />, then
                choose <strong>Add to Home Screen</strong>.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
