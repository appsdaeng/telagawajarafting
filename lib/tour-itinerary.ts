import { cacheLife, cacheTag } from "next/cache";
import { databaseConfigured, sql } from "@/lib/db";

/**
 * The itinerary steps for a tour, as set in Admin → Tours (rich text, one
 * paragraph per line).
 *
 * Returns an empty list when the tour has none, the database is not configured
 * or the query fails, so the public page simply leaves the section out rather
 * than showing an empty heading.
 */
export async function getTourItinerary(slug: string): Promise<string[]> {
  "use cache";
  cacheTag("tours");
  cacheLife("minutes");

  if (!databaseConfigured) {
    return [];
  }

  try {
    const rows = await sql<{ itinerary: string[] | null }[]>`
      select itinerary from public.tours where slug = ${slug} limit 1
    `;

    return (rows[0]?.itinerary ?? [])
      .map((step) => (typeof step === "string" ? step.trim() : ""))
      .filter(Boolean);
  } catch (error) {
    console.error("[tours] could not read the tour itinerary", error);
    return [];
  }
}
