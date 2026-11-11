import { cacheLife, cacheTag } from "next/cache";
import { databaseConfigured, sql } from "@/lib/db";
import { hasPublicFile } from "@/lib/media";

/**
 * The photo shown for a tour on the public site.
 *
 * The admin portal writes `/admin/tours` to `public.tours.image_url`, either an
 * uploaded file's public URL or a pasted link/path, so that is read first. When
 * the tour has no photo in the database — or the database is not configured, or
 * the query fails — the bundled photo named in `lib/tours.ts` is used, and then
 * the shared hero still, so a tour page never renders an empty media area.
 */
export type TourPhoto = { src: string; alt: string };

/** Bundled rafting photo used when neither the database nor the catalogue has one. */
const FALLBACK_PHOTO = "/media/hero.jpeg";

type PhotoRow = { image_url: string | null; image_alt: string | null };

export async function getTourPhoto(
  slug: string,
  cataloguePhoto: { src: string; alt: string },
): Promise<TourPhoto | null> {
  "use cache";
  cacheTag("tours");
  cacheLife("minutes");

  if (databaseConfigured) {
    try {
      const rows = await sql<PhotoRow[]>`
        select image_url, image_alt from public.tours where slug = ${slug} limit 1
      `;
      const row = rows[0];
      const src = row?.image_url?.trim();

      if (src) {
        return { src, alt: row?.image_alt?.trim() || cataloguePhoto.alt };
      }
    } catch (error) {
      console.error("[tours] could not read the tour photo, using the bundled one", error);
    }
  }

  if (hasPublicFile(cataloguePhoto.src)) {
    return cataloguePhoto;
  }

  if (hasPublicFile(FALLBACK_PHOTO)) {
    return { src: FALLBACK_PHOTO, alt: cataloguePhoto.alt };
  }

  return null;
}
