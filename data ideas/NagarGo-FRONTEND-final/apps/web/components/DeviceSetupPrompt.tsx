"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

type LocationState = "unknown" | "granted" | "denied" | "prompt";

export function DeviceSetupPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>("unknown");
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const updateInstalled = () => setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    updateInstalled();
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);

    const token = localStorage.getItem("nagargo_access_token");
    if (!token) return () => window.removeEventListener("beforeinstallprompt", onInstall);

    async function readPermission() {
      try {
        if ("permissions" in navigator) {
          const result = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          setLocationState(result.state as LocationState);
          result.onchange = () => setLocationState(result.state as LocationState);
        } else {
          setLocationState("prompt");
        }
      } catch {
        setLocationState("prompt");
      }
    }
    void readPermission();
    const timer = window.setInterval(() => {
      if (localStorage.getItem("nagargo_access_token")) setVisible(true);
    }, 45_000);
    setVisible(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.clearInterval(timer);
    };
  }, []);

  const needsInstall = !installed && Boolean(installEvent);
  const needsLocation = locationState !== "granted";
  if (!visible || (!needsInstall && !needsLocation)) return null;

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setInstallEvent(null);
    }
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setMessage("This browser does not provide location access. Use a current Chrome, Safari, or Firefox browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => { setLocationState("granted"); setMessage("Location permission granted. Live delivery tracking is ready."); },
      (error) => {
        setLocationState(error.code === error.PERMISSION_DENIED ? "denied" : "prompt");
        setMessage(error.code === error.PERMISSION_DENIED ? "Location is blocked. Open your browser site settings, allow Location for NagarGo, then reload this page." : "Location could not be read. Check GPS and try again.");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  }

  return (
    <aside className="fixed bottom-5 left-5 z-[90] w-[min(92vw,430px)] rounded-xl border-2 border-route-green/20 bg-white p-4 shadow-2xl animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-ink">Finish setting up NagarGo</p>
          <p className="mt-1 text-sm text-ink/65">Install the app and allow location so you receive alerts and can see live delivery movement.</p>
        </div>
        <button type="button" onClick={() => { setVisible(false); window.setTimeout(() => setVisible(true), 45_000); }} className="border-0 bg-transparent px-1 text-xl leading-none text-ink/40" aria-label="Remind me later">×</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {needsInstall && <button type="button" onClick={install} className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white">Install NagarGo app</button>}
        {needsLocation && <button type="button" onClick={requestLocation} className="rounded-lg bg-route-green px-4 py-2 text-sm font-bold text-white">Allow location</button>}
      </div>
      {locationState === "denied" && <p className="mt-2 text-xs font-semibold text-amber-700">Location is currently blocked. Use the lock/settings icon beside the address bar to allow it.</p>}
      {message && <p className="mt-2 text-xs text-ink/65">{message}</p>}
    </aside>
  );
}
