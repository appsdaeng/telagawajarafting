import { NextResponse } from "next/server";
import { getTourBySlug, isBlocked, priceFor, slotsFor } from "@/lib/bookings";
import { getBookingSettings } from "@/lib/settings";
import { databaseConfigured } from "@/lib/db";

/** Live slots and the price for one tour on one date. */
export async function GET(request: Request): Promise<Response> {
  if (!databaseConfigured) {
    return NextResponse.json({ error: "Booking is not configured yet." }, { status: 503 });
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const date = url.searchParams.get("date") ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Send a date as YYYY-MM-DD." }, { status: 400 });
  }

  const tour = await getTourBySlug(slug);

  if (!tour || !tour.published) {
    return NextResponse.json({ error: "Tour not found." }, { status: 404 });
  }

  const settings = await getBookingSettings();
  const blocked = await isBlocked(tour.id, date);
  const slots = blocked ? [] : await slotsFor(tour.id, date);
  const price = await priceFor(tour, date);

  return NextResponse.json(
    {
      tour: { slug: tour.slug, name: tour.name },
      date,
      blocked,
      slots,
      price,
      minAdvanceDays: settings.minAdvanceDays,
      maxPartySize: settings.maxPartySize,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
