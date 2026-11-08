import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/tours";

/**
 * robots.txt.
 *
 * The portal paths are blocked here as a second line of defence — the pages
 * themselves also need noindex and, more importantly, server-side auth. robots
 * is etiquette, not access control.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/admin/", "/pos", "/staff", "/checkout", "/book/confirmed"],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteConfig.siteUrl).toString(),
    host: siteConfig.siteUrl,
  };
}
