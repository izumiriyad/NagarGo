import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://nagargo.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/book", "/medicine", "/orders", "/about", "/contact", "/legal", "/rider/register"],
        disallow: ["/admin", "/admin/*", "/api/*", "/_next/*"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
