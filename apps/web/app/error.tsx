"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F6F7F5", color: "#0B1220" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1.25rem" }}>⚠️</div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#6b7280", maxWidth: 360, lineHeight: 1.6, margin: "0 0 0.5rem" }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          {error?.digest && (
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1.5rem" }}>Error ID: {error.digest}</p>
          )}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{ background: "#0B1220", color: "#fff", border: "none", borderRadius: 999, padding: "0.7rem 1.75rem", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{ background: "transparent", color: "#0B1220", border: "1.5px solid rgba(11,18,32,0.2)", borderRadius: 999, padding: "0.7rem 1.75rem", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
