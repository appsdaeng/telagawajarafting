import { cacheLife, cacheTag } from "next/cache";
import { gallery as fallbackGallery, type GalleryImage } from "@/lib/content";
import { databaseConfigured, sql } from "@/lib/db";

type GalleryRow = { url: string; alt: string | null; caption: string | null };

/** How many photos the public gallery shows at most. */
export const GALLERY_LIMIT = 15;

/**
 * Photos shown on the public site, read from `public.gallery_images` — the same
 * table the admin portal writes to, so an upload or an approved link appears
 * without a code change.
 *
 * Only approved rows are returned. When the database is not configured (or the
 * query fails) the curated list in `lib/content.ts` is used instead, so the
 * site still renders during a preview build with no credentials.
 */
export async function getGalleryImages(): Promise<GalleryImage[]> {
  "use cache";
  cacheTag("gallery");
  cacheLife("minutes");

  if (!databaseConfigured) {
    return fallbackGallery.slice(0, GALLERY_LIMIT);
  }

  try {
    const rows = await sql<GalleryRow[]>`
      select url, alt, caption
      from public.gallery_images
      where approved = true
      order by sort_order asc, created_at desc
      limit ${GALLERY_LIMIT}
    `;

    const images = rows
      .map((row) => {
        const src = row.url?.trim();
        if (!src) return null;
        const alt = row.alt?.trim() || row.caption?.trim() || "Telaga Waja rafting in Bali";
        return { src, alt };
      })
      .filter((image): image is GalleryImage => image !== null);

    return images.length > 0 ? images : fallbackGallery.slice(0, GALLERY_LIMIT);
  } catch (error) {
    console.error("[gallery] could not read gallery_images, using bundled photos", error);
    return fallbackGallery.slice(0, GALLERY_LIMIT);
  }
}
