"use client";
export default function OfflinePage() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f9f9f9", color: "#111" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>📡</div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
            You&apos;re offline
          </h1>
          <p style={{ maxWidth: 360, color: "#666", lineHeight: 1.6, margin: "0 0 2rem" }}>
            NagarGo needs an internet connection to show live orders, pricing, and maps.
            Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "0.75rem 2rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              marginTop: "1.25rem",
              fontSize: "0.875rem",
              color: "#2c7a3a",
              textDecoration: "underline",
            }}
          >
            ← Go home
          </a>
        </div>
      </body>
    </html>
  );
}
