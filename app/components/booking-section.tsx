import { BookingWidget } from "@/app/components/booking-widget";
import type { TourOption } from "@/lib/db-types";
import { databaseConfigured, sql } from "@/lib/db";
import { tours } from "@/lib/tours";

/**
 * Loads each tour's bookable options and hands them to the client widget.
 *
 * Rendered inside <Suspense> so the marketing page keeps its static shell and
 * the uncached database read streams in at request time.
 */
export async function BookingSection() {
  const rows = databaseConfigured
    ? await sql<{ slug: string; pricing_options: TourOption[] }[]>`
        select slug, pricing_options from public.tours where published = true
      `
    : [];
  const bySlug = new Map(
    rows.map((row) => [row.slug, Array.isArray(row.pricing_options) ? row.pricing_options : []]),
  );

  return (
    <BookingWidget
      options={tours.map((tour) => ({
        slug: tour.slug,
        name: tour.name,
        priceAdult: tour.priceAdult,
        priceChild: tour.priceChild,
        pricingOptions: bySlug.get(tour.slug) ?? [],
      }))}
    />
  );
}
