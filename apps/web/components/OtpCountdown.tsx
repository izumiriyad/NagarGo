"use client";
import { useEffect, useState } from "react";

interface Props {
  /** Seconds to count down. Defaults to 60. */
  seconds?: number;
  /** Called when timer expires (zero reached). */
  onExpire?: () => void;
  /** Called when the "Resend" button is clicked. */
  onResend?: () => void;
  /** Extra Tailwind classes */
  className?: string;
}

/**
 * Countdown timer used on OTP/resend flows.
 * Shows "Resend in X s" then an active "Resend OTP" button once expired.
 */
export function OtpCountdown({ seconds = 60, onExpire, onResend, className = "" }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setRemaining(seconds);
    setDone(false);
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setDone(true);
          onExpire?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  if (!done) {
    return (
      <p className={`text-xs text-ink/50 ${className}`}>
        Resend in <span className="font-semibold text-ink">{remaining}s</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onResend}
      className={`text-xs font-semibold text-route-green underline underline-offset-2 hover:text-route-green-dark transition ${className}`}
    >
      Resend OTP
    </button>
  );
}
