import type { MetadataRoute } from "next";
import { siteConfig, tours } from "@/lib/tours";

/**
 * Generated sitemap. Tour URLs come from the same catalogue the pages are built
 * from, so adding a tour can never leave the sitemap out of date.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteConfig.siteUrl).toString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/tours"), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/faq"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/contact"), changeFrequency: "monthly", priority: 0.5 },
  ];

  const tourPages: MetadataRoute.Sitemap = tours.map((tour) => ({
    url: url(`/tours/${tour.slug}`),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...tourPages];
}
