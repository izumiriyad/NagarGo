"use client";

interface Props {
  /** Current password value */
  password: string;
  className?: string;
}

interface Level {
  label: string;
  color: string;
  barColor: string;
  width: string;
}

function score(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0–5
}

const LEVELS: Level[] = [
  { label: "Too short", color: "text-ink/30", barColor: "bg-ink/15", width: "w-0" },
  { label: "Very weak", color: "text-red-500", barColor: "bg-red-400", width: "w-1/5" },
  { label: "Weak", color: "text-amber-500", barColor: "bg-amber-400", width: "w-2/5" },
  { label: "Fair", color: "text-yellow-600", barColor: "bg-yellow-400", width: "w-3/5" },
  { label: "Strong", color: "text-route-green-dark", barColor: "bg-route-green", width: "w-4/5" },
  { label: "Very strong", color: "text-route-green-dark", barColor: "bg-route-green", width: "w-full" },
];

/**
 * Visual password strength meter.
 * Shows a coloured progress bar and label.
 * Rendered below the password input on signup.
 */
export function PasswordStrengthMeter({ password, className = "" }: Props) {
  if (!password) return null;

  const s = Math.min(score(password), 5);
  const level = LEVELS[s]!;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${level.barColor} ${level.width}`}
        />
      </div>
      <p className={`text-xs font-semibold ${level.color}`}>{level.label}</p>
    </div>
  );
}
