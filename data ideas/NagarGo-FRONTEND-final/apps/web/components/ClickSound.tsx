"use client";
import { useEffect, useRef } from "react";

/**
 * Adds a short, synthesized click sound to every button in the app
 * via a single document-level listener — no audio asset to ship, no
 * per-button wiring needed. Uses the Web Audio API to generate a
 * ~60ms tone rather than loading a file, so it works offline and
 * costs nothing on page weight.
 *
 * Browsers block audio until a user gesture unlocks the
 * AudioContext, which is exactly what a click already is — so the
 * context is created lazily, on first click.
 */
export function ClickSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    function playClick() {
      try {
        if (!ctxRef.current) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioCtx) return;
          ctxRef.current = new AudioCtx();
        }
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(720, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch {
        // Audio is a nice-to-have; never let it break a click.
      }
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      const interactive = target?.closest('button, [role="button"], a, input[type="submit"], input[type="button"], select');
      if (interactive && !(interactive as HTMLButtonElement).disabled) playClick();
    }

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => document.removeEventListener("pointerdown", onPointerDown, { capture: true } as any);
  }, []);

  return null;
}
