"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  /** Seconds to count down. Defaults to 60. */
  seconds?: number;
  /** Called when timer reaches zero. */
  onExpire?: () => void;
  /** Called when the "Resend OTP" button is clicked. Resets the timer. */
  onResend?: () => void;
  /** Extra CSS class string passed to the wrapper. */
  className?: string;
}

/**
 * OTP countdown timer with animated SVG progress ring.
 *
 * States:
 *  - Counting  → ring drains from full → empty, shows remaining seconds
 *  - Expired   → "Resend OTP" button activates; clicking it calls onResend
 *                and resets the timer to the original `seconds` value
 *
 * Uses window.setInterval so it never fires in SSR.
 * Supports prefers-reduced-motion via a plain text fallback (no SVG).
 */
export function OtpCountdown({
  seconds = 60,
  onExpire,
  onResend,
  className = "",
}: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const [done, setDone] = useState(false);
  const [resendKey, setResendKey] = useState(0); // bump to restart timer
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restart whenever seconds prop changes or user hits "Resend"
  useEffect(() => {
    setRemaining(seconds);
    setDone(false);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setDone(true);
          onExpire?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // resendKey forces a fresh timer each time user clicks Resend
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, resendKey]);

  function handleResend() {
    onResend?.();
    setResendKey((k) => k + 1); // triggers useEffect → fresh countdown
  }

  // SVG ring params
  const R = 10; // radius
  const C = 2 * Math.PI * R; // circumference ≈ 62.83
  const progress = remaining / seconds; // 1 → 0
  const dash = C * progress;

  // Colour: green while > 30 %, amber 10–30 %, red < 10 %
  const ringColor =
    progress > 0.3
      ? "var(--color-route-green, #22c55e)"
      : progress > 0.1
      ? "#f59e0b"
      : "#ef4444";

  if (done) {
    return (
      <button
        type="button"
        id="otp-resend-btn"
        onClick={handleResend}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-route-green underline underline-offset-2 transition hover:text-route-green-dark focus-visible:outline-route-green ${className}`}
      >
        {/* Refresh icon */}
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
        </svg>
        Resend OTP
      </button>
    );
  }

  return (
    <p
      className={`inline-flex items-center gap-2 text-xs text-ink/50 ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Animated progress ring — hidden if user prefers reduced motion */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="shrink-0 motion-reduce:hidden"
      >
        {/* Track */}
        <circle cx="12" cy="12" r={R} stroke="currentColor" strokeWidth="2.5" opacity="0.12" />
        {/* Progress */}
        <circle
          cx="12"
          cy="12"
          r={R}
          stroke={ringColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          transform="rotate(-90 12 12)"
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.4s ease" }}
        />
      </svg>
      Resend in{" "}
      <span className="font-semibold tabular-nums text-ink">
        {remaining}s
      </span>
    </p>
  );
}
