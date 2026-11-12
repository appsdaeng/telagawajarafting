import { randomInt } from "node:crypto";
import { sql } from "@/lib/db";
import type {
  BookingRow,
  BookingSource,
  BookingStatus,
  PaymentStatus,
  TourRow,
} from "@/lib/db-types";

/** A problem the caller should show the user, not a stack trace. */
export class BookingError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "BookingError";
    this.status = status;
  }
}

export type Slot = {
  time: string;
  capacity: number;
  booked: number;
  remaining: number;
};

/**
 * Departure slots with live remaining capacity.
 *
 * A cancelled booking frees its seats; everything else (pending, confirmed,
 * completed) holds them, because a pending request still needs the seat while a
 * human confirms it.
 */
export async function slotsFor(tourId: string, date: string): Promise<Slot[]> {
  const rows = await sql<{ time: string; capacity: number; booked: number }[]>`
    select
      d.time,
      d.capacity,
      coalesce(
        (
          select sum(b.adults + b.children)
          from public.bookings b
          where b.tour_id = d.tour_id
            and b.departure_time = d.time
            and b.booking_date = ${date}::date
            and b.status <> 'CANCELLED'
        ),
        0
      )::int as booked
    from public.tour_departures d
    where d.tour_id = ${tourId} and d.active = true
    order by d.time
  `;

  return rows.map((row) => ({
    time: row.time,
    capacity: row.capacity,
    booked: row.booked,
    remaining: Math.max(0, row.capacity - row.booked),
  }));
}

export async function isBlocked(tourId: string, date: string): Promise<boolean> {
  const rows = await sql<{ blocked: boolean }[]>`
    select true as blocked
    from public.blocked_dates
    where date = ${date}::date
      and (tour_id is null or tour_id = ${tourId})
    limit 1
  `;

  return rows.length > 0;
}

export async function getTourById(id: string): Promise<TourRow | null> {
  const rows = await sql<TourRow[]>`select * from public.tours where id = ${id} limit 1`;
  return rows[0] ?? null;
}

export async function getTourBySlug(slug: string): Promise<TourRow | null> {
  const rows = await sql<TourRow[]>`select * from public.tours where slug = ${slug} limit 1`;
  return rows[0] ?? null;
}

export async function listTours(includeUnpublished = true): Promise<TourRow[]> {
  if (includeUnpublished) {
    return sql<TourRow[]>`select * from public.tours order by sort_order, name`;
  }

  return sql<TourRow[]>`
    select * from public.tours where published = true order by sort_order, name
  `;
}

export type Price = { adult: number; child: number; label: string };

/** Special price for the date wins over the tour's normal rate. */
export async function priceFor(tour: TourRow, date: string): Promise<Price> {
  const rows = await sql<{ price_adult: number; price_child: number; label: string }[]>`
    select price_adult, price_child, label
    from public.special_prices
    where date = ${date}::date
      and (tour_id = ${tour.id} or tour_id is null)
    order by tour_id nulls last
    limit 1
  `;
  const special = rows[0];

  if (special) {
    return {
      adult: special.price_adult,
      child: special.price_child,
      label: special.label || "Special rate",
    };
  }

  return { adult: tour.price_adult, child: tour.price_child, label: "" };
}

export function quote(price: Price, adults: number, children: number): number {
  return adults * price.adult + children * price.child;
}

/** TWR-20261109-4F7K — short enough to read over the phone. */
export function newBookingCode(date: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";

  for (let index = 0; index < 4; index += 1) {
    suffix += alphabet[randomInt(alphabet.length)];
  }

  return `TWR-${date.replaceAll("-", "")}-${suffix}`;
}

export type CreateBookingInput = {
  tourId: string;
  date: string;
  time: string;
  adults: number;
  children: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  hotel?: string;
  notes?: string;
  /** Per-person price of a selected tour option; overrides the date rate. */
  unitPrice?: number;
  source: BookingSource;
  createdById?: string | null;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  paymentProvider?: string;
  providerRef?: string | null;
};

/**
 * Create a booking and hold its seats atomically.
 *
 * The capacity read, the insert and the payment row happen in one transaction so
 * two guests cannot both take the last seat at the same departure.
 */
export async function createBooking(input: CreateBookingInput): Promise<BookingRow> {
  const party = input.adults + input.children;

  if (party < 1) {
    throw new BookingError("A booking needs at least one guest.");
  }

  if (await isBlocked(input.tourId, input.date)) {
    throw new BookingError("We are closed on that date. Please pick another day.", 409);
  }

  const tour = await getTourById(input.tourId);

  if (!tour || !tour.published) {
    throw new BookingError("That tour is not available.", 404);
  }

  const price = await priceFor(tour, input.date);
  const total =
    input.unitPrice && input.unitPrice > 0
      ? input.unitPrice * (input.adults + input.children)
      : quote(price, input.adults, input.children);
  const paidAt = input.paymentStatus === "PAID" ? new Date() : null;

  return sql.begin(async (tx) => {
    const slot = await tx<{ capacity: number; booked: number }[]>`
      select
        d.capacity,
        coalesce(
          (
            select sum(b.adults + b.children)
            from public.bookings b
            where b.tour_id = d.tour_id
              and b.departure_time = d.time
              and b.booking_date = ${input.date}::date
              and b.status <> 'CANCELLED'
          ),
          0
        )::int as booked
      from public.tour_departures d
      where d.tour_id = ${input.tourId} and d.time = ${input.time} and d.active = true
      for update
    `;
    const departure = slot[0];

    if (!departure) {
      throw new BookingError("That departure time is not on the schedule.", 409);
    }

    if (departure.booked + party > departure.capacity) {
      throw new BookingError(
        `Only ${Math.max(0, departure.capacity - departure.booked)} seats left at ${input.time}.`,
        409,
      );
    }

    const [booking] = await tx<BookingRow[]>`
      insert into public.bookings (
        code, tour_id, booking_date, departure_time, adults, children, total_amount,
        status, source, guest_name, guest_email, guest_phone, hotel, notes,
        payment_status, payment_method, created_by
      ) values (
        ${newBookingCode(input.date)}, ${input.tourId}, ${input.date}::date, ${input.time},
        ${input.adults}, ${input.children}, ${total},
        ${input.source === "POS" ? "CONFIRMED" : "PENDING"}, ${input.source},
        ${input.guestName}, ${input.guestEmail ?? ""}, ${input.guestPhone ?? ""},
        ${input.hotel ?? ""}, ${input.notes ?? ""},
        ${input.paymentStatus ?? "UNPAID"}, ${input.paymentMethod ?? ""},
        ${input.createdById ?? null}
      )
      returning *
    `;

    if (input.paymentStatus && input.paymentStatus !== "UNPAID") {
      await tx`
        insert into public.payments (
          booking_id, provider, provider_ref, method, amount, status, paid_at
        ) values (
          ${booking.id}, ${input.paymentProvider ?? "MANUAL"}, ${input.providerRef ?? null},
          ${input.paymentMethod ?? "cash"}, ${total},
          ${input.paymentStatus === "PAID" ? "PAID" : "PENDING"},
          ${paidAt}
        )
      `;
    }

    return booking;
  });
}

export async function setBookingStatus(
  id: string,
  status: BookingStatus,
  reason = "",
): Promise<void> {
  await sql`
    update public.bookings
    set status = ${status},
        cancelled_at = ${status === "CANCELLED" ? sql`now()` : null},
        cancellation_reason = ${status === "CANCELLED" ? reason : ""},
        updated_at = now()
    where id = ${id}
  `;
}

export async function setPaymentStatus(
  id: string,
  status: PaymentStatus,
  method?: string,
): Promise<void> {
  await sql`
    update public.bookings
    set payment_status = ${status},
        payment_method = coalesce(${method ?? null}, payment_method),
        updated_at = now()
    where id = ${id}
  `;
}

export async function rescheduleBooking(id: string, date: string, time: string): Promise<void> {
  await sql`
    update public.bookings
    set booking_date = ${date}::date, departure_time = ${time}, updated_at = now()
    where id = ${id}
  `;
}
