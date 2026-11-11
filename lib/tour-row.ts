import { cacheLife, cacheTag } from "next/cache";
import { databaseConfigured, sql } from "@/lib/db";
import type { TourRow } from "@/lib/db-types";

/**
 * Read a single tour row from Postgres for the public tour page. Cached with
 * the `tours` tag so admin saves (which call revalidateTag("tours", "max"))
 * refresh it within about a minute, while unedited tours fall back to the
 * bundled catalogue.
 */
export async function getTourRow(slug: string): Promise<TourRow | null> {
  "use cache";
  cacheTag("tours");
  cacheLife("minutes");

  if (!databaseConfigured) {
    return null;
  }

  try {
    const rows = await sql<TourRow[]>`
      select * from public.tours where slug = ${slug} limit 1
    `;

    return rows[0] ?? null;
  } catch (error) {
    console.error("[tours] could not read the tour row", error);
    return null;
  }
}
