import { cacheLife, cacheTag } from "next/cache";
import { databaseConfigured, sql } from "@/lib/db";

/**
 * The itinerary for a tour, as set in Admin → Tours (rich text).
 *
 * Returns an empty string when the tour has none, the database is not
 * configured or the query fails, so the public page simply leaves the section
 * out rather than showing an empty heading.
 */
export async function getTourItinerary(slug: string): Promise<string> {
  "use cache";
  cacheTag("tours");
  cacheLife("minutes");

  if (!databaseConfigured) {
    return "";
  }

  try {
    const rows = await sql<{ itinerary: string | null }[]>`
      select itinerary from public.tours where slug = ${slug} limit 1
    `;

    return (rows[0]?.itinerary ?? "").trim();
  } catch (error) {
    console.error("[tours] could not read the tour itinerary", error);
    return "";
  }
}
