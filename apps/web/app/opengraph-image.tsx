import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NagarGo — Trusted Local Delivery in Rajshahi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0B1220 0%, #1a2d1f 60%, #0B1220 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px",
        }}
      >
        {/* Logo mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#2C7A3A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            🛵
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#ffffff", fontSize: 48, fontWeight: 800, lineHeight: 1 }}>NagarGo</span>
            <span style={{ color: "#4ade80", fontSize: 18, fontWeight: 500, marginTop: 4 }}>Rajshahi&apos;s Local Delivery</span>
          </div>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: "#ffffff",
            fontSize: 52,
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.15,
            margin: 0,
            maxWidth: 900,
          }}
        >
          Send anything. Get anything. Delivered fast.
        </h1>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 40, marginTop: 48 }}>
          {[
            ["2 min", "Avg response"],
            ["4.9 ★", "Customer rating"],
            ["100%", "Verified riders"],
            ["OTP", "Protected handoff"],
          ].map(([val, label]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "rgba(44,122,58,0.15)",
                border: "1px solid rgba(44,122,58,0.4)",
                borderRadius: 16,
                padding: "16px 24px",
              }}
            >
              <span style={{ color: "#4ade80", fontSize: 28, fontWeight: 800 }}>{val}</span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 16, marginTop: 48 }}>nagargo.com</p>
      </div>
    ),
    { ...size }
  );
}
