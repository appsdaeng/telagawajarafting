import { cacheLife, cacheTag } from "next/cache";
import { databaseConfigured, sql } from "@/lib/db";
import type { TourRow } from "@/lib/db-types";
import { asTourOptions } from "@/lib/tour-options";

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

    const row = rows[0];

    if (!row) {
      return null;
    }

    // pricing_options is jsonb, so it can hold something that is not an array;
    // the tour page reads it straight from here.
    return { ...row, pricing_options: asTourOptions(row.pricing_options) };
  } catch (error) {
    console.error("[tours] could not read the tour row", error);
    return null;
  }
}
