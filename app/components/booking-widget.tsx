"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import {
  describeParty,
  departureTimes,
  isBlockedDate,
  quote,
} from "@/lib/availability";
import { formatRupiah, siteConfig, whatsappLink } from "@/lib/tours";

type PricingChoice = {
  name: string;
  description: string;
  field: string;
  price: number;
};

type Option = {
  slug: string;
  name: string;
  priceAdult: number;
  priceChild: number;
  pricingOptions?: PricingChoice[];
};

type Slot = {
  time: string;
  capacity: number | null;
  remaining: number | null;
};

/** The page never navigates client-side, so there is nothing to subscribe to. */
function subscribeToUrl() {
  return () => {};
}

const readSearch = () => window.location.search;
const readSearchOnServer = () => "";

/**
 * Booking widget.
 *
 * Checks live capacity through /api/availability, then reserves the seats through
 * /api/bookings. When the payment gateway is switched on the guest goes straight
 * to Midtrans; otherwise the booking is held and confirmed by hand, which is how
 * the site worked before. WhatsApp stays as the no-friction fallback.
 */
export function BookingWidget({ options }: { options: Option[] }) {
  const [chosenSlug, setChosenSlug] = useState<string | null>(null);
  const [chosenOption, setChosenOption] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [checked, setChecked] = useState<null | { closed: boolean }>(null);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [guest, setGuest] = useState({ name: "", email: "", phone: "", hotel: "" });
  const dateRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // `?tour=slug` from a "Book now" card. Read through useSyncExternalStore so
  // the prerendered HTML (empty search) and the client agree on first paint.
  const search = useSyncExternalStore(subscribeToUrl, readSearch, readSearchOnServer);
  const requested = new URLSearchParams(search).get("tour");
  const defaultSlug =
    requested && options.some((option) => option.slug === requested)
      ? requested
      : (options[0]?.slug ?? "");

  const tourSlug = chosenSlug ?? defaultSlug;
  const tour = options.find((option) => option.slug === tourSlug) ?? options[0];

  // A tour option picked on the tour page arrives as `?option=Name`; the guest
  // can still change it here. Everyone is charged the option's tier price.
  const requestedOption = new URLSearchParams(search).get("option");
  const pricingOptions = tour?.pricingOptions ?? [];
  const wantedOption = chosenOption ?? requestedOption ?? "";
  const selectedOption =
    pricingOptions.find((choice) => choice.name === wantedOption) ?? pricingOptions[0] ?? null;
  const total = tour
    ? selectedOption && selectedOption.price > 0
      ? selectedOption.price * (adults + children)
      : quote(tour, adults, children)
    : 0;

  // Date bounds are a DOM detail, so they are applied to the input directly
  // rather than held in state (which would mean a second render on mount).
  useEffect(() => {
    if (!dateRef.current) {
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateRef.current.min = tomorrow.toISOString().slice(0, 10);
  }, []);

  function reset(next: () => void) {
    next();
    setChecked(null);
    setTime(null);
    setError(null);
    setSlots(null);
    setOnlineError(null);
  }

  async function handleCheck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!date) {
      setError("Choose a date first.");
      return;
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`;

    if (date <= today) {
      setError("Book at least one day ahead — pick a date from tomorrow.");
      return;
    }

    if (isBlockedDate(date)) {
      setChecked({ closed: true });
      setTime(null);
      track("availability_checked", { tour: tourSlug, closed: true });
      return;
    }

    setChecked({ closed: false });
    setTime(null);
    setSlots(null);
    setChecking(true);
    setOnlineError(null);

    // Live capacity from the database. If the portal is not connected yet the
    // widget keeps working against the published schedule and WhatsApp.
    try {
      const response = await fetch(
        `/api/availability?slug=${encodeURIComponent(tourSlug)}&date=${date}`,
      );
      const data = (await response.json()) as { blocked?: boolean; slots?: Slot[] };

      if (!response.ok) {
        setSlots(departureTimes.map((slot) => ({ time: slot, capacity: null, remaining: null })));
        setTime(departureTimes[0]);
      } else if (data.blocked) {
        setChecked({ closed: true });
      } else {
        const nextSlots = data.slots ?? [];
        setSlots(nextSlots);
        setTime(nextSlots.find((slot) => (slot.remaining ?? 1) > 0)?.time ?? null);
      }

      track("availability_checked", { tour: tourSlug, date, closed: false, live: response.ok });
    } catch {
      setSlots(departureTimes.map((slot) => ({ time: slot, capacity: null, remaining: null })));
      setTime(departureTimes[0]);
      track("availability_checked", { tour: tourSlug, date, closed: false, live: false });
    } finally {
      setChecking(false);
    }
  }

  async function reserveOnline(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!time || !guest.name) {
      setOnlineError("Add your name and pick a departure.");
      return;
    }

    setSubmitting(true);
    setOnlineError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tourSlug,
          date,
          time,
          adults,
          children,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          hotel: guest.hotel,
          option: selectedOption?.name ?? "",
        }),
      });
      const data = (await response.json()) as {
        code?: string;
        total?: number;
        paymentUrl?: string | null;
        error?: string;
      };

      if (!response.ok || !data.code) {
        setOnlineError(data.error ?? "Could not reserve those seats. Try WhatsApp instead.");
        return;
      }

      track("online_booking", {
        tour: tourSlug,
        option: selectedOption?.name ?? "",
        total: data.total ?? 0,
      });

      if (data.paymentUrl) {
        window.location.assign(data.paymentUrl);
        return;
      }

      router.push(`/book/confirmed?code=${encodeURIComponent(data.code)}`);
    } catch {
      setOnlineError("Network error. Send the request on WhatsApp instead.");
    } finally {
      setSubmitting(false);
    }
  }

  const message = tour
    ? `Hi ${siteConfig.name}, I would like to book ${tour.name}${
        selectedOption ? ` (${selectedOption.name})` : ""
      } on ${date || "(date)"}${
        time ? ` at ${time}` : ""
      } for ${describeParty(adults, children)}. Total ${formatRupiah(total)}. My hotel: `
    : "";

  return (
    <div id="book" className="scroll-mt-24">
      <form
        onSubmit={handleCheck}
        className="rounded-3xl border border-river-100 bg-white p-5 shadow-xl shadow-river-950/10 sm:p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Check your date</h2>
          <p className="text-xs text-river-500">No prepayment to reserve — pay after we confirm</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label htmlFor="booking-tour" className="text-xs font-medium text-river-700">
              Tour
            </label>
            <select
              id="booking-tour"
              value={tourSlug}
              onChange={(event) => reset(() => setChosenSlug(event.target.value))}
              className="mt-1 w-full rounded-xl border border-river-200 bg-white px-3 py-2.5 text-sm text-river-950 focus:border-river-500 focus:ring-2 focus:ring-river-200 focus:outline-none"
            >
              {options.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="booking-date" className="text-xs font-medium text-river-700">
              Date
            </label>
            <input
              id="booking-date"
              ref={dateRef}
              type="date"
              value={date}
              onChange={(event) => reset(() => setDate(event.target.value))}
              className="mt-1 w-full rounded-xl border border-river-200 bg-white px-3 py-2.5 text-sm text-river-950 focus:border-river-500 focus:ring-2 focus:ring-river-200 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="booking-adults" className="text-xs font-medium text-river-700">
              Adults
            </label>
            <select
              id="booking-adults"
              value={adults}
              onChange={(event) => reset(() => setAdults(Number(event.target.value)))}
              className="mt-1 w-full rounded-xl border border-river-200 bg-white px-3 py-2.5 text-sm text-river-950 focus:border-river-500 focus:ring-2 focus:ring-river-200 focus:outline-none"
            >
              {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="booking-children" className="text-xs font-medium text-river-700">
              Children (7–12)
            </label>
            <select
              id="booking-children"
              value={children}
              onChange={(event) => reset(() => setChildren(Number(event.target.value)))}
              className="mt-1 w-full rounded-xl border border-river-200 bg-white px-3 py-2.5 text-sm text-river-950 focus:border-river-500 focus:ring-2 focus:ring-river-200 focus:outline-none"
            >
              {Array.from({ length: 11 }, (_, index) => index).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          {pricingOptions.length > 0 && selectedOption ? (
            <div className="sm:col-span-2 lg:col-span-12">
              <label htmlFor="booking-option" className="text-xs font-medium text-river-700">
                Option
              </label>
              <select
                id="booking-option"
                value={selectedOption.name}
                onChange={(event) => setChosenOption(event.target.value)}
                className="mt-1 w-full rounded-xl border border-river-200 bg-white px-3 py-2.5 text-sm text-river-950 focus:border-river-500 focus:ring-2 focus:ring-river-200 focus:outline-none"
              >
                {pricingOptions.map((choice) => (
                  <option key={choice.name} value={choice.name}>
                    {choice.name}
                    {choice.price > 0 ? ` — ${formatRupiah(choice.price)} / person` : ""}
                  </option>
                ))}
              </select>
              {selectedOption.description ? (
                <p className="mt-1 text-xs text-river-600">{selectedOption.description}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm text-river-800">
            {error ? (
              <span className="font-medium text-red-700">{error}</span>
            ) : (
              <>
                Total for {describeParty(adults, children)}:{" "}
                <strong className="font-semibold text-river-950">{formatRupiah(total)}</strong>
              </>
            )}
          </p>
          <button
            type="submit"
            className="rounded-full bg-river-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-river-700"
          >
            Check availability
          </button>
        </div>

        {checked ? (
          <div className="mt-4 rounded-2xl bg-river-50 p-4">
            {checked.closed ? (
              <p className="text-sm text-river-900">
                We are closed on that date. Pick another day, or message us and we will find an
                option.
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-river-950">
                  {checking
                    ? "Checking the schedule…"
                    : `${(slots ?? []).filter((slot) => (slot.remaining ?? 1) > 0).length} departures on ${date}`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(slots ?? []).map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setTime(slot.time)}
                      disabled={(slot.remaining ?? 1) === 0}
                      aria-pressed={time === slot.time}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        (slot.remaining ?? 1) === 0
                          ? "border-river-100 bg-river-50 text-river-400"
                          : time === slot.time
                            ? "border-river-600 bg-river-600 text-white"
                            : "border-river-200 bg-white text-river-900 hover:border-river-400"
                      }`}
                    >
                      {slot.time}
                      {slot.remaining !== null ? (
                        <span className="ml-2 text-xs opacity-80">
                          {slot.remaining === 0 ? "full" : `${slot.remaining} left`}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-river-600">
                  Departure times come from our current schedule. We confirm your seats and
                  pickup time when you message us — usually within a few minutes.
                </p>
              </>
            )}
          </div>
        ) : null}
      </form>

      {checked && !checked.closed ? (
        <>
          <form
            onSubmit={reserveOnline}
            className="mt-3 rounded-2xl border border-river-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold">Reserve online</p>
            <p className="mt-1 text-xs text-river-600">
              We hold the seats for you and confirm by WhatsApp. Nothing is charged until we
              confirm your departure.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="block text-xs font-medium text-river-700">
                Name
                <input
                  value={guest.name}
                  onChange={(event) =>
                    setGuest((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                  className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2 text-sm focus:border-river-500 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-river-700">
                WhatsApp number
                <input
                  value={guest.phone}
                  onChange={(event) =>
                    setGuest((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2 text-sm focus:border-river-500 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-river-700">
                Email (optional)
                <input
                  type="email"
                  value={guest.email}
                  onChange={(event) =>
                    setGuest((current) => ({ ...current, email: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2 text-sm focus:border-river-500 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-river-700">
                Hotel for pickup (optional)
                <input
                  value={guest.hotel}
                  onChange={(event) =>
                    setGuest((current) => ({ ...current, hotel: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2 text-sm focus:border-river-500 focus:outline-none"
                />
              </label>
            </div>

            {onlineError ? (
              <p className="mt-2 text-xs font-medium text-red-700">{onlineError}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !time}
              className="mt-3 w-full rounded-full bg-river-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-river-700 disabled:opacity-60"
            >
              {submitting ? "Reserving…" : "Reserve these seats"}
            </button>
          </form>

          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_handoff", { tour: tourSlug, adults, children, total })}
            className="mt-3 block rounded-full bg-sand-400 px-6 py-3.5 text-center text-sm font-semibold text-river-950 transition-colors hover:bg-sand-300"
          >
            Ask on WhatsApp instead
          </a>
        </>
      ) : null}
    </div>
  );
}
