import type { Metadata } from "next";
import Link from "next/link";
import { databaseConfigured, sql } from "@/lib/db";
import { formatRupiah, siteConfig, whatsappLink } from "@/lib/tours";

export const metadata: Metadata = {
  title: "Booking received",
  robots: { index: false, follow: false },
};

type Row = {
  code: string;
  tour_name: string;
  booking_date: string;
  departure_time: string;
  adults: number;
  children: number;
  total_amount: number;
  payment_status: string;
};

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  let booking: Row | null = null;

  if (code && databaseConfigured) {
    const rows = await sql<Row[]>`
      select b.code, t.name as tour_name, b.booking_date::text as booking_date,
             b.departure_time, b.adults, b.children, b.total_amount, b.payment_status
      from public.bookings b
      join public.tours t on t.id = b.tour_id
      where b.code = ${code}
      limit 1
    `;
    booking = rows[0] ?? null;
  }

  return (
    <div className="container-page py-16 sm:py-20">
      <div className="max-w-xl">
        <p className="text-xs font-semibold tracking-widest text-river-500 uppercase">
          Booking received
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {booking ? "You're on the list" : "We could not find that booking"}
        </h1>

        {booking ? (
          <>
            <p className="mt-4 leading-relaxed text-river-800">
              Keep the code below. We confirm every departure by hand and message you on WhatsApp
              with the pickup time — usually within a few hours.
            </p>

            <dl className="mt-8 space-y-3 rounded-2xl border border-river-100 p-5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-river-500">Booking code</dt>
                <dd className="font-mono font-semibold">{booking.code}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-river-500">Tour</dt>
                <dd className="text-right">{booking.tour_name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-river-500">Date</dt>
                <dd>
                  {booking.booking_date} at {booking.departure_time}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-river-500">Guests</dt>
                <dd>
                  {booking.adults} adult{booking.adults === 1 ? "" : "s"}
                  {booking.children
                    ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`
                    : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-river-500">Total</dt>
                <dd className="font-semibold">{formatRupiah(booking.total_amount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-river-500">Payment</dt>
                <dd className="uppercase">{booking.payment_status}</dd>
              </div>
            </dl>

            <a
              href={whatsappLink(
                `Hi ${siteConfig.name}, my booking code is ${booking.code}. Can you confirm the pickup time?`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-full bg-river-600 px-6 py-3 text-sm font-semibold text-white hover:bg-river-700"
            >
              Message us on WhatsApp
            </a>
          </>
        ) : (
          <p className="mt-4 leading-relaxed text-river-800">
            The link may be incomplete, or the booking was cancelled. Message us on WhatsApp and we
            will look it up for you.
          </p>
        )}

        <p className="mt-8 text-sm">
          <Link href="/" className="text-river-700 underline">
            Back to the site
          </Link>
        </p>
      </div>
    </div>
  );
}

export const instant = false;
