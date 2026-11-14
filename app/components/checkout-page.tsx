"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TourOption, TourOptionField } from "@/lib/db-types";
import {
  discountFor,
  findCoupon,
  PAYMENT_METHODS,
  type Coupon,
  type PaymentMethodId,
} from "@/lib/coupons";
import { formatRupiah } from "@/lib/tours";
import { priceForParty } from "@/lib/tour-options";

type Props = {
  slug: string;
  tourName: string;
  duration: string;
  meetingPoint: string;
  imageUrl: string;
  options: TourOption[];
  adultPrice: number;
  childPrice: number;
  initialOption: string;
  initialDate: string;
  initialTime: string;
  initialAdults: number;
  initialChildren: number;
};

type Saved = { answers?: Record<string, string>; notes?: string };

function formatLongDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Steps() {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs text-river-500">
      <li className="flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-full bg-emerald-600 text-[0.65rem] font-bold text-white">
          ✓
        </span>
        <span>Date and guests</span>
        <span className="text-river-300">—</span>
      </li>
      <li className="flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-full bg-river-950 text-[0.65rem] font-bold text-white">
          2
        </span>
        <span className="font-semibold text-river-950">Your details and payment</span>
        <span className="text-river-300">—</span>
      </li>
      <li className="flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-full bg-river-100 text-[0.65rem] font-bold text-river-500">
          3
        </span>
        <span>Confirmation</span>
      </li>
    </ol>
  );
}

/**
 * The checkout step.
 *
 * The booking window hands over the date, the departure, the party and the
 * answers to the option's fields; this page adds the guest's details, an
 * optional coupon and the payment method. The reservation itself is still
 * created by /api/bookings, so seats, prices and the gateway are unchanged.
 */
export function CheckoutPage({
  slug,
  tourName,
  duration,
  meetingPoint,
  imageUrl,
  options,
  adultPrice,
  childPrice,
  initialOption,
  initialDate,
  initialTime,
  initialAdults,
  initialChildren,
}: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [guest, setGuest] = useState({ name: "", email: "", phone: "", country: "" });
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethodId>("card");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const visible = options.filter((option) => option.active !== false);
  const option = visible.find((item) => item.name === initialOption) ?? visible[0] ?? null;
  const fields: TourOptionField[] = option?.fields ?? [];
  const adults = initialAdults;
  const children = initialChildren;
  const party = adults + children;
  // The tier that covers this party size sets the price, exactly as the tour
  // page and the booking API do.
  const tierPrice = option ? priceForParty(option, party) : 0;
  const unit = tierPrice > 0 ? tierPrice : option && option.price > 0 ? option.price : adultPrice;
  const childUnit = option ? unit : childPrice;
  const gross = unit * adults + childUnit * children;
  const discount = discountFor(gross, coupon);
  const total = Math.max(0, gross - discount);
  const cashChosen = method === "cash";

  // Answers typed in the booking window are kept in sessionStorage; read them
  // in an async body so no state is set during the effect itself.
  useEffect(() => {
    const load = async () => {
      try {
        const raw = window.sessionStorage.getItem(`twr-booking:${slug}`);

        if (!raw) return;

        const saved = JSON.parse(raw) as Saved;
        setAnswers(saved.answers ?? {});
        setNotes(saved.notes ?? "");
      } catch {
        // Storage can be blocked; the checkout still works without them.
      }
    };

    void load();
  }, [slug]);

  const applyCoupon = () => {
    const found = findCoupon(couponInput);

    if (!found) {
      setCoupon(null);
      setCouponError("That code is not valid.");
      return;
    }

    setCoupon(found);
    setCouponError(null);
    // Cash on arrival cannot carry a coupon, so a prepaid method is chosen.
    if (method === "cash") {
      setMethod("card");
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const answered = fields
    .filter((field) => field.type !== "Read Only")
    .map((field) => ({
      label: field.label || field.name,
      value: (answers[field.label || field.name] ?? "").trim(),
    }))
    .filter((item) => item.value);

  const submit = async () => {
    if (!guest.name.trim()) {
      setError("Add the full name for the booking.");
      return;
    }

    if (!guest.email.trim() && !guest.phone.trim()) {
      setError("Leave an email or a WhatsApp number so we can confirm.");
      return;
    }

    if (!agreed) {
      setError("Please accept the cancellation policy and the safety rules.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const detail = answered.map((item) => `${item.label}: ${item.value}`).join(" · ");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          date: initialDate,
          time: initialTime,
          adults,
          children,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          hotel: guest.country,
          option: option?.name ?? "",
          coupon: coupon?.code ?? "",
          paymentMethod: method,
          notes: [detail, notes].filter(Boolean).join(" · "),
        }),
      });
      const data = (await response.json()) as {
        code?: string;
        paymentUrl?: string | null;
        error?: string;
      };

      if (!response.ok || !data.code) {
        setError(data.error ?? "Could not hold those seats. Try again or message us on WhatsApp.");
        return;
      }

      if (data.paymentUrl) {
        window.location.assign(data.paymentUrl);
        return;
      }

      router.push(`/book/confirmed?code=${encodeURIComponent(data.code)}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Link
        href={`/tours/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-river-700 hover:text-river-900"
      >
        ← Back to tour page
      </Link>

      <div className="mt-3">
        <Steps />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-river-950 sm:text-3xl">
          Your details and payment
        </h1>
        <p className="mt-1 text-sm text-river-600">
          {tourName} · {formatLongDate(initialDate)} at {initialTime}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div>
          {/* Guest details */}
          <section className="rounded-2xl border border-river-100 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-river-950">Guest details</h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-river-700">Full name</span>
                <input
                  value={guest.name}
                  onChange={(event) => setGuest({ ...guest, name: event.target.value })}
                  placeholder="Name on the booking"
                  className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2.5 text-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-river-700">Email</span>
                <input
                  type="email"
                  value={guest.email}
                  onChange={(event) => setGuest({ ...guest, email: event.target.value })}
                  placeholder="you@email.com"
                  className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2.5 text-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-river-700">WhatsApp number</span>
                <input
                  value={guest.phone}
                  onChange={(event) => setGuest({ ...guest, phone: event.target.value })}
                  placeholder="+62 …"
                  className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2.5 text-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-river-700">Country</span>
                <input
                  value={guest.country}
                  onChange={(event) => setGuest({ ...guest, country: event.target.value })}
                  placeholder="Indonesia"
                  className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2.5 text-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
                />
              </label>
            </div>
          </section>

          {/* Discount coupon */}
          <section className="mt-4 rounded-2xl border border-river-100 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-river-950">Discount coupon</h2>

            <div className="mt-3 flex gap-2">
              <input
                value={couponInput}
                onChange={(event) => {
                  setCouponInput(event.target.value);
                  setCouponError(null);
                }}
                placeholder="Coupon code"
                className="w-full rounded-xl border border-river-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="shrink-0 rounded-xl bg-river-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-river-800"
              >
                Apply
              </button>
            </div>

            {couponError ? (
              <p className="mt-2 text-xs font-medium text-red-700">{couponError}</p>
            ) : null}

            {coupon ? (
              <>
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  Coupon {coupon.code} applied. You save {coupon.percent}% (
                  {formatRupiah(discount)}).
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="ml-2 font-medium text-river-500 underline"
                  >
                    Remove
                  </button>
                </p>
                <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
                  Discounted bookings are non-refundable for any reason. You can reschedule your
                  booking.
                </p>
              </>
            ) : null}

            <p className="mt-3 text-xs leading-relaxed text-river-500">
              Coupons work with Card, PayPal, QR, E-wallet, Google Pay and Apple Pay. They cannot be
              used with Cash on arrival.
            </p>
          </section>

          {/* Payment method */}
          <section className="mt-4 rounded-2xl border border-river-100 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-river-950">Payment method</h2>

            <div className="mt-3 space-y-2">
              {PAYMENT_METHODS.map((payment) => {
                const disabled = payment.id === "cash" && Boolean(coupon);
                const active = method === payment.id;

                return (
                  <label
                    key={payment.id}
                    className={`block rounded-xl border px-3 py-2.5 ${
                      disabled
                        ? "cursor-not-allowed border-river-100 bg-river-50/60 text-river-400"
                        : active
                          ? "border-river-600 bg-river-50/60 ring-1 ring-river-200"
                          : "border-river-200 bg-white"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="payment"
                          value={payment.id}
                          checked={active}
                          disabled={disabled}
                          onChange={() => setMethod(payment.id)}
                          className="size-4"
                        />
                        <span className="text-sm font-medium">{payment.label}</span>
                      </span>
                      <span className="text-xs text-river-500">
                        {disabled ? "Coupons not valid" : payment.hint}
                      </span>
                    </span>

                    {payment.id === "card" && active ? (
                      <span className="mt-2 block text-xs text-river-500">
                        Card details are entered in the payment gateway’s secure form and never
                        stored on our server.
                      </span>
                    ) : null}

                    {payment.id === "cash" ? (
                      <span className="mt-1 block text-xs text-river-500">
                        Pay in cash when you meet us at the venue. No hotel transfer.
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-river-500">
              Google Pay and Apple Pay appear only on supported devices and browsers. The available
              methods depend on the payment gateway.
            </p>
          </section>

          <label className="mt-4 flex items-start gap-2 rounded-2xl border border-river-100 bg-white p-4 text-xs leading-relaxed text-river-700">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 size-4 shrink-0"
            />
            <span>
              I agree to the cancellation policy and the safety rules (age 6+, weight 15–120 kg). I
              understand that discounted bookings are non-refundable for any reason, but can be
              rescheduled.
            </span>
          </label>
        </div>

        {/* Summary */}
        <aside className="rounded-2xl border border-river-100 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold text-river-950">Booking summary</h2>

          <div className="mt-3 flex gap-3">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="size-16 shrink-0 rounded-xl bg-river-100 object-cover"
              />
            ) : (
              <span className="size-16 shrink-0 rounded-xl bg-river-100" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-river-950">{tourName}</p>
              {option ? (
                <p className="mt-0.5 text-xs text-river-600">Option: {option.name}</p>
              ) : null}
            </div>
          </div>

          <dl className="mt-3 space-y-1.5 text-sm text-river-800">
            <div className="flex justify-between gap-3">
              <dt className="text-river-500">Date</dt>
              <dd>{formatLongDate(initialDate)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-river-500">Time</dt>
              <dd>{initialTime}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-river-500">Guests</dt>
              <dd>
                {adults} adult{adults === 1 ? "" : "s"}
                {children ? `, ${children} child${children === 1 ? "" : "ren"}` : ""}
              </dd>
            </div>
            {duration ? (
              <div className="flex justify-between gap-3">
                <dt className="text-river-500">Duration</dt>
                <dd>{duration}</dd>
              </div>
            ) : null}
            {answered.map((item) => (
              <div key={item.label} className="flex justify-between gap-3">
                <dt className="text-river-500">{item.label}</dt>
                <dd className="text-right">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 space-y-1 border-t border-river-100 pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-river-700">
                {adults} × Adult {formatRupiah(unit)}
              </span>
              <span className="font-medium">{formatRupiah(unit * adults)}</span>
            </div>
            {children > 0 ? (
              <div className="flex justify-between gap-3">
                <span className="text-river-700">
                  {children} × Child {formatRupiah(childUnit)}
                </span>
                <span className="font-medium">{formatRupiah(childUnit * children)}</span>
              </div>
            ) : null}
            {discount > 0 && coupon ? (
              <div className="flex justify-between gap-3 text-emerald-700">
                <span>Discount ({coupon.code})</span>
                <span className="font-medium">− {formatRupiah(discount)}</span>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-3 pt-2">
              <span className="text-sm font-semibold text-river-950">Total</span>
              <span className="text-xl font-semibold text-river-950">{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-river-500">Refund</span>
              <span className={coupon ? "font-medium text-amber-700" : "text-river-700"}>
                {coupon ? "Non-refundable" : "Free until 24 hours before"}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-river-500">Reschedule</span>
              <span className="text-river-700">Accepted</span>
            </div>
          </div>

          {meetingPoint ? (
            <p className="mt-3 text-xs text-river-500">Meeting point: {meetingPoint}</p>
          ) : null}

          {error ? <p className="mt-3 text-xs font-medium text-red-700">{error}</p> : null}

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="mt-4 w-full rounded-full bg-river-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-river-700 disabled:opacity-60"
          >
            {submitting
              ? "Reserving…"
              : cashChosen
                ? `Confirm booking · pay ${formatRupiah(total)} on arrival`
                : `Pay ${formatRupiah(total)}`}
          </button>

          <p className="mt-2 text-center text-xs text-river-500">
            {cashChosen
              ? "Your seats are held and staff confirm the booking by hand."
              : "You will get your booking code by email and WhatsApp right after payment."}
          </p>
        </aside>
      </div>
    </div>
  );
}
