import { cacheLife, cacheTag } from "next/cache";
import { databaseConfigured, sql } from "@/lib/db";
import { hasPublicFile } from "@/lib/media";

/**
 * The photos shown for a tour on the public site.
 *
 * The admin portal writes `/admin/tours` to `public.tours`: `image_url` is the
 * cover (used on the tour cards, the page banner and the social image) and
 * `gallery_urls` holds the extra photos shown behind the gallery arrows. The
 * cover always comes first. When the tour has no photos in the database — or
 * the database is not configured, or the query fails — the bundled photo named
 * in `lib/tours.ts` is used, and then the shared hero still, so a tour page
 * never renders an empty media area.
 */
export type TourPhoto = { src: string; alt: string };

/** Bundled rafting photo used when neither the database nor the catalogue has one. */
const FALLBACK_PHOTO = "/media/hero.jpeg";

type PhotoRow = {
  image_url: string | null;
  image_alt: string | null;
  gallery_urls: string[] | null;
};

function unique(photos: TourPhoto[]): TourPhoto[] {
  const seen = new Set<string>();

  return photos.filter((photo) => {
    if (!photo.src || seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });
}

export async function getTourPhotos(
  slug: string,
  cataloguePhoto: { src: string; alt: string },
): Promise<TourPhoto[]> {
  "use cache";
  cacheTag("tours");
  cacheLife("minutes");

  const photos: TourPhoto[] = [];

  if (databaseConfigured) {
    try {
      const rows = await sql<PhotoRow[]>`
        select image_url, image_alt, gallery_urls from public.tours where slug = ${slug} limit 1
      `;
      const row = rows[0];
      const alt = row?.image_alt?.trim() || cataloguePhoto.alt;
      const cover = row?.image_url?.trim();

      if (cover) {
        photos.push({ src: cover, alt });
      }

      for (const url of row?.gallery_urls ?? []) {
        const src = typeof url === "string" ? url.trim() : "";
        if (src) photos.push({ src, alt });
      }
    } catch (error) {
      console.error("[tours] could not read the tour photos, using the bundled one", error);
    }
  }

  const found = unique(photos);

  if (found.length > 0) {
    return found;
  }

  if (hasPublicFile(cataloguePhoto.src)) {
    return [cataloguePhoto];
  }

  if (hasPublicFile(FALLBACK_PHOTO)) {
    return [{ src: FALLBACK_PHOTO, alt: cataloguePhoto.alt }];
  }

  return [];
}

/** Just the cover photo — the one used on cards and the page banner. */
export async function getTourPhoto(
  slug: string,
  cataloguePhoto: { src: string; alt: string },
): Promise<TourPhoto | null> {
  const photos = await getTourPhotos(slug, cataloguePhoto);
  return photos[0] ?? null;
}
