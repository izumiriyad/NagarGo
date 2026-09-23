"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("nagargo_install_dismissed") === "1") return;
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setVisible(Boolean(localStorage.getItem("nagargo_access_token")));
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!visible || !installEvent) return null;

  async function install() {
    const pendingInstall = installEvent;
    if (!pendingInstall) return;
    await pendingInstall.prompt();
    const choice = await pendingInstall.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
  }

  function dismiss() {
    localStorage.setItem("nagargo_install_dismissed", "1");
    setVisible(false);
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-route-green/20 bg-white p-3 shadow-xl">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-route-green text-lg text-white">N</div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">Install NagarGo</p>
        <p className="text-xs text-ink/60">Keep delivery tracking one tap away.</p>
      </div>
      <button onClick={install} className="shrink-0 rounded-full bg-ink px-3 py-2 text-xs font-bold text-white">Install</button>
      <button onClick={dismiss} aria-label="Dismiss install prompt" className="shrink-0 px-1 text-lg leading-none text-ink/40">×</button>
    </div>
  );
}
