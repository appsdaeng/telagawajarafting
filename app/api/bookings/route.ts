import { NextResponse } from "next/server";
import { BookingError, createBooking, getTourBySlug } from "@/lib/bookings";
import { findCoupon, isPaymentMethod } from "@/lib/coupons";
import { databaseConfigured, sql } from "@/lib/db";
import { notifyBookingCreated } from "@/lib/email";
import { createSnapTransaction, midtransConfigured } from "@/lib/payments/midtrans";
import { priceForParty, tierForParty } from "@/lib/tour-options";
import { getBookingSettings, getPaymentSettings } from "@/lib/settings";

type Payload = {
  slug?: string;
  date?: string;
  time?: string;
  adults?: number;
  children?: number;
  name?: string;
  email?: string;
  phone?: string;
  hotel?: string;
  notes?: string;
  option?: string;
  coupon?: string;
  paymentMethod?: string;
};

function clean(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Create an online booking.
 *
 * Two outcomes, both honest:
 *  - gateway on and configured → returns a Midtrans redirect URL, booking held
 *    while payment is pending
 *  - otherwise → returns the code for the confirmation page, with payment settled
 *    by staff exactly as the site works today
 *
 * A coupon (see lib/coupons) is only for prepaid bookings, so it is refused with
 * cash on arrival, and it comes off the total inside createBooking.
 */
export async function POST(request: Request): Promise<Response> {
  if (!databaseConfigured) {
    return NextResponse.json({ error: "Booking is not configured yet." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as Payload | null;

  if (!body) {
    return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
  }

  const slug = clean(body.slug, 80);
  const date = clean(body.date, 10);
  const time = clean(body.time, 5);
  const adults = Math.max(0, Math.trunc(Number(body.adults ?? 0)));
  const children = Math.max(0, Math.trunc(Number(body.children ?? 0)));
  const name = clean(body.name, 120);
  const email = clean(body.email, 160);
  const phone = clean(body.phone, 40);
  const hotel = clean(body.hotel, 160);
  const notes = clean(body.notes, 800);
  const optionName = clean(body.option, 120);
  const couponCode = clean(body.coupon, 20);
  const coupon = findCoupon(couponCode);
  const paymentMethod = clean(body.paymentMethod, 20).toLowerCase();

  if (paymentMethod && !isPaymentMethod(paymentMethod)) {
    return NextResponse.json({ error: "Pick a payment method from the list." }, { status: 400 });
  }

  if (couponCode && !coupon) {
    return NextResponse.json({ error: "That coupon code is not valid." }, { status: 400 });
  }

  // A coupon is only for prepaid bookings: cash at the venue is not allowed.
  if (coupon && paymentMethod === "cash") {
    return NextResponse.json(
      { error: "Coupons cannot be used with cash on arrival. Pay online or remove the coupon." },
      { status: 400 },
    );
  }

  if (!name) {
    return NextResponse.json({ error: "A name is required." }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^[0-2][0-9]:[0-5][0-9]$/.test(time)) {
    return NextResponse.json({ error: "Pick a valid date and departure." }, { status: 400 });
  }

  if (!email && !phone) {
    return NextResponse.json(
      { error: "Leave an email or a phone number so we can confirm." },
      { status: 400 },
    );
  }

  const settings = await getBookingSettings();

  if (adults + children < 1) {
    return NextResponse.json({ error: "Add at least one guest." }, { status: 400 });
  }

  if (adults + children > settings.maxPartySize) {
    return NextResponse.json(
      { error: `For more than ${settings.maxPartySize} guests, message us on WhatsApp.` },
      { status: 400 },
    );
  }

  const tour = await getTourBySlug(slug);

  if (!tour || !tour.published) {
    return NextResponse.json({ error: "Tour not found." }, { status: 404 });
  }

  const choices = Array.isArray(tour.pricing_options) ? tour.pricing_options : [];
  const option = optionName
    ? (choices.find(
        (choice) => choice.name.trim().toLowerCase() === optionName.toLowerCase(),
      ) ?? null)
    : null;

  if (optionName && !option) {
    return NextResponse.json(
      { error: "That option is no longer available. Pick another one." },
      { status: 409 },
    );
  }

  // Every tier covers its own guest range; outside them the option is not sold
  // online, so a stale tab cannot book a price that does not exist.
  if (option && option.tiers?.length && !tierForParty(option, adults + children)) {
    return NextResponse.json(
      {
        error: `This option is not bookable online for ${adults + children} guests. Message us and we will arrange it.`,
      },
      { status: 409 },
    );
  }

  // The chosen option is part of the reservation, so staff see it in the notes
  // and everyone is charged the option's tier price. A coupon is recorded with
  // the reason the booking is non-refundable, so staff are not surprised by it.
  const bookingNotes = [
    option ? `Option: ${option.name}` : "",
    coupon ? `Coupon ${coupon.code} (-${coupon.percent}%), non-refundable` : "",
    paymentMethod ? `Payment method: ${paymentMethod}` : "",
    notes,
  ]
    .filter(Boolean)
    .join(" · ");

  // The option's tier for this party size decides the per-person price, so the
  // charge matches what the tour page and the checkout page quoted.
  const optionUnit = option
    ? priceForParty(option, adults + children) || option.price
    : undefined;

  try {
    const booking = await createBooking({
      tourId: tour.id,
      date,
      time,
      adults,
      children,
      guestName: name,
      guestEmail: email,
      guestPhone: phone,
      hotel,
      notes: bookingNotes,
      unitPrice: optionUnit,
      discountPercent: coupon?.percent ?? 0,
      paymentMethod: paymentMethod || undefined,
      source: "ONLINE",
    });

    const payments = await getPaymentSettings();
    // Cash at the venue is settled by staff, never by the gateway.
    const canCharge =
      paymentMethod !== "cash" && payments.gatewayEnabled && midtransConfigured();

    if (canCharge) {
      const amount =
        payments.depositPercent > 0
          ? Math.round((booking.total_amount * payments.depositPercent) / 100)
          : booking.total_amount;

      const snap = await createSnapTransaction({
        orderId: booking.code,
        amount,
        sandbox: payments.sandbox,
        customer: { name, email, phone },
        items: [
          {
            id: tour.slug,
            name: `${tour.name}${option ? ` · ${option.name}` : ""} · ${date} ${time}`,
            price: amount,
            quantity: 1,
          },
        ],
        finishUrl: `${new URL(request.url).origin}/book/confirmed?code=${booking.code}`,
      });

      if (snap.ok) {
        await sql`
          insert into public.payments (booking_id, provider, provider_ref, method, amount, status)
          values (${booking.id}, 'MIDTRANS', ${booking.code}, 'gateway', ${amount}, 'PENDING')
        `;
        await sql`
          update public.bookings
          set payment_status = 'PENDING', payment_method = 'gateway', updated_at = now()
          where id = ${booking.id}
        `;

        return NextResponse.json({
          code: booking.code,
          total: booking.total_amount,
          deposit: amount,
          paymentUrl: snap.redirectUrl,
        });
      }

      // Gateway failed: keep the booking, fall back to staff confirmation.
      await notifyBookingCreated(booking, tour.name).catch(() => {});
      return NextResponse.json({
        code: booking.code,
        total: booking.total_amount,
        paymentUrl: null,
        warning: snap.error,
      });
    }

    await notifyBookingCreated(booking, tour.name).catch(() => {});

    return NextResponse.json({
      code: booking.code,
      total: booking.total_amount,
      paymentUrl: null,
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not create the booking." }, { status: 500 });
  }
}
