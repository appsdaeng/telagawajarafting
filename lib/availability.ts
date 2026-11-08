/**
 * Departure schedule and pricing.
 *
 * These are the operator's configured departure times, not live seat counts.
 * Until bookings live in Postgres there is nothing to subtract from, so the
 * widget shows the schedule and confirms seats with a human on WhatsApp. When
 * the database lands, `departureTimes` and `blockedDates` become rows and the
 * availability check moves behind an API route so capacity can actually be
 * decremented per booking.
 */

/** Configured departure times. Admin-editable in Phase 2. */
export const departureTimes = ["09:00", "11:00", "13:00"] as const;

/**
 * Dates the river is closed (Nyepi, maintenance, private groups).
 * ISO `YYYY-MM-DD`. Empty until the operator supplies real closure dates.
 */
export const blockedDates: string[] = [];

export function isBlockedDate(isoDate: string): boolean {
  return blockedDates.includes(isoDate);
}

/** Total price for a party, in whole rupiah. */
export function quote(
  tour: { priceAdult: number; priceChild: number },
  adults: number,
  children: number,
): number {
  return adults * tour.priceAdult + children * tour.priceChild;
}

/** "2 adults, 1 child" — used in WhatsApp messages and price summaries. */
export function describeParty(adults: number, children: number): string {
  const parts = [`${adults} adult${adults === 1 ? "" : "s"}`];

  if (children > 0) {
    parts.push(`${children} child${children === 1 ? "" : "ren"}`);
  }

  return parts.join(", ");
}
