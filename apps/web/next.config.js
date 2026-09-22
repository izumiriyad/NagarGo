/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Extract origin from API URL for CSP
function apiOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      // Cloudinary CDN — profile photos, NID docs uploaded via storageService
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Allow local dev API uploads
      { protocol: "http", hostname: "localhost" },
    ],
  },

  async headers() {
    const apiOrg = apiOrigin(API_URL);

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            // Content Security Policy
            // - 'self' for same-origin JS/CSS/images
            // - Google Maps script and tiles
            // - Cloudinary for images
            // - Our own API (WebSocket + REST)
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `connect-src 'self' ${apiOrg} wss://${apiOrigin(API_URL).replace(/^https?:\/\//, "")} https://maps.googleapis.com https://res.cloudinary.com`,
              "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
