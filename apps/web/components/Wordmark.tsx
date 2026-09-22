export function Wordmark({ size = "md", tone = "dark" }: { size?: "sm" | "md" | "lg"; tone?: "dark" | "light" }) {
  const sizes = {
    sm: "text-lg",
    md: "text-3xl",
    lg: "text-4xl sm:text-5xl",
  } as const;
  const capSizes = {
    sm: "text-xl",
    md: "text-4xl",
    lg: "text-5xl sm:text-6xl",
  } as const;
  const base = tone === "dark" ? "text-ink" : "text-white";
  const accent = tone === "dark" ? "text-route-green" : "text-route-green-light";

  return (
    <span className={`font-display font-extrabold tracking-tight drop-shadow-sm ${base} ${sizes[size]}`}>
      <span className={`${accent} ${capSizes[size]}`}>N</span>agar
      <span className={`${accent} ${capSizes[size]}`}>G</span>o
    </span>
  );
}
