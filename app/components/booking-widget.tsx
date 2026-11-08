"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { track } from "@vercel/analytics";
import {
  describeParty,
  departureTimes,
  isBlockedDate,
  quote,
} from "@/lib/availability";
import { formatRupiah, siteConfig, whatsappLink } from "@/lib/tours";

type Option = {
  slug: string;
  name: string;
  priceAdult: number;
  priceChild: number;
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
 * Deliberately does not pretend to hold a reservation: it reads the operator's
 * configured departure times, prices the party, and hands the request to
 * WhatsApp, which is how bookings are confirmed today. Real seat inventory needs
 * the Postgres bookings table and a server-side availability check — this
 * component is where that call will be wired in.
 */
export function BookingWidget({ options }: { options: Option[] }) {
  const [chosenSlug, setChosenSlug] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [checked, setChecked] = useState<null | { closed: boolean }>(null);
  const [error, setError] = useState<string | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);

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
  const total = tour ? quote(tour, adults, children) : 0;

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
  }

  function handleCheck(event: React.FormEvent<HTMLFormElement>) {
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
    setTime(departureTimes[0]);
    track("availability_checked", { tour: tourSlug, date, closed: false });
  }

  const message = tour
    ? `Hi ${siteConfig.name}, I would like to book ${tour.name} on ${date || "(date)"}${
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
                  {departureTimes.length} departures on {date}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {departureTimes.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      aria-pressed={time === slot}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        time === slot
                          ? "border-river-600 bg-river-600 text-white"
                          : "border-river-200 bg-white text-river-900 hover:border-river-400"
                      }`}
                    >
                      {slot}
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
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            track("whatsapp_handoff", { tour: tourSlug, adults, children, total })
          }
          className="mt-3 block rounded-full bg-sand-400 px-6 py-3.5 text-center text-sm font-semibold text-river-950 transition-colors hover:bg-sand-300"
        >
          Send booking request on WhatsApp
        </a>
      ) : null}
    </div>
  );
}
