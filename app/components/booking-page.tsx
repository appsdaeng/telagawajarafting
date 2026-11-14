"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TourOption, TourOptionField } from "@/lib/db-types";
import { departureTimes } from "@/lib/availability";
import { formatRupiah } from "@/lib/tours";

type Slot = {
  time: string;
  capacity: number | null;
  remaining: number | null;
};

type Props = {
  slug: string;
  tourName: string;
  duration: string;
  meetingPoint: string;
  options: TourOption[];
  adultPrice: number;
  childPrice: number;
  initialOption: string;
  initialDate: string;
  initialAdults: number;
  initialChildren: number;
};

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

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-river-100 bg-white p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-river-950">
        <span className="grid size-5 place-items-center rounded-full bg-river-600 text-[0.65rem] font-bold text-white">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-river-100 py-2.5 last:border-0">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-river-900">{label}</span>
        <span className="block text-xs text-river-500">{hint}</span>
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`One fewer ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="grid size-8 place-items-center rounded-full border border-river-200 text-river-700 transition-colors hover:bg-river-50 disabled:opacity-40"
        >
          −
        </button>
        <span aria-live="polite" className="w-7 text-center text-sm font-semibold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`One more ${label.toLowerCase()}`}
          onClick={() => onChange(value + 1)}
          className="grid size-8 place-items-center rounded-full border border-river-200 text-river-700 transition-colors hover:bg-river-50"
        >
          +
        </button>
      </span>
    </div>
  );
}

/**
 * The booking window opened from an option card on the tour page.
 *
 * It is a single page: pick the date, the departure, the guests and answer the
 * option's extra questions, with the running total beside it. The reservation
 * is created by the same /api/bookings endpoint the home page uses, so the
 * seats, prices and confirmation are identical.
 */
export function BookingPage({
  slug,
  tourName,
  duration,
  meetingPoint,
  options,
  adultPrice,
  childPrice,
  initialOption,
  initialDate,
  initialAdults,
  initialChildren,
}: Props) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  // The schedule for one date. Keeping the date beside the answer is what makes
  // "loading" and "loaded" the same value, so the effect that fetches never has
  // to set state before it starts.
  const [schedule, setSchedule] = useState<{
    date: string;
    slots: Slot[];
    blocked: boolean;
  } | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [guest, setGuest] = useState({ name: "", phone: "", email: "" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = schedule && schedule.date === date ? schedule : null;
  const loading = Boolean(date) && !current;
  const slots = current?.slots ?? null;
  const blocked = current?.blocked ?? false;

  const visible = options.filter((option) => option.active !== false);
  const option = visible.find((item) => item.name === initialOption) ?? visible[0] ?? null;
  const fields: TourOptionField[] = option?.fields ?? [];
  const unit = option && option.price > 0 ? option.price : adultPrice;
  // A separate child price only exists on the tour itself; an option is per person.
  const childUnit = option ? unit : childPrice;
  const party = adults + children;
  const total = unit * adults + childUnit * children;

  // Load the departures for the chosen date. All state lands in the async body,
  // never in the effect itself: the render already knows the answer is stale
  // because `schedule.date` no longer matches.
  useEffect(() => {
    if (!date) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      const fallback = () => {
        if (cancelled) return;
        setSchedule({
          date,
          slots: departureTimes.map((slot) => ({ time: slot, capacity: null, remaining: null })),
          blocked: false,
        });
        setTime(departureTimes[0] ?? null);
      };

      try {
        const response = await fetch(
          `/api/availability?slug=${encodeURIComponent(slug)}&date=${date}`,
        );

        // No live schedule (database not connected): fall back to the published
        // departures so the guest can still finish the booking.
        if (!response.ok) {
          fallback();
          return;
        }

        const data = (await response.json()) as { blocked?: boolean; slots?: Slot[] };

        if (cancelled) return;

        const next = data.slots ?? [];
        setSchedule({ date, slots: next, blocked: data.blocked === true });
        setTime(next.find((slot) => (slot.remaining ?? 1) > 0)?.time ?? null);
      } catch {
        fallback();
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [date, slug]);

  const chosenChoice = fields.find((field) => field.type === "Dropdown Selector");

  const submit = async () => {
    if (!date) {
      setError("Choose a date.");
      return;
    }

    if (!current) {
      setError("Wait for the departures to load, then choose a time.");
      return;
    }

    if (!time || !(slots ?? []).some((slot) => slot.time === time)) {
      setError("Choose a departure time.");
      return;
    }

    if (!guest.name.trim()) {
      setError("Add your name so we know who is coming.");
      return;
    }

    if (!guest.phone.trim() && !guest.email.trim()) {
      setError("Leave a WhatsApp number or an email so we can confirm.");
      return;
    }

    const missing = fields.find(
      (field) => field.required && !(answers[field.name || field.label] ?? "").trim(),
    );

    if (missing) {
      setError(`Answer “${missing.label || missing.name}” to continue.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const detail = fields
      .map((field) => {
        const value = (answers[field.name || field.label] ?? "").trim();
        return value ? `${field.name || field.label}: ${value}` : "";
      })
      .filter(Boolean)
      .join(" · ");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          date,
          time,
          adults,
          children,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          option: option?.name ?? "",
          notes: [detail, notes.trim()].filter(Boolean).join(" · "),
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
        <h1 className="text-2xl font-semibold tracking-tight text-river-950 sm:text-3xl">
          {option?.name || tourName}
        </h1>
        <p className="mt-1 text-sm text-river-600">
          {tourName}
          {meetingPoint ? ` · ${meetingPoint}` : ""}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div>
          <Step number={1} title="Choose date">
            <input
              type="date"
              value={date}
              // A DOM detail rather than state: reading today's date in state
              // during the prerender is what Next.js rejects.
              ref={(input) => {
                if (!input || input.min) return;
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                input.min = tomorrow.toISOString().slice(0, 10);
              }}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-river-200 bg-white px-3 py-2.5 text-sm text-river-950 shadow-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
            />
            {date ? <p className="mt-2 text-xs text-river-600">{formatLongDate(date)}</p> : null}
          </Step>

          <Step number={2} title="Choose time">
            {!date ? (
              <p className="text-sm text-river-500">Pick a date first.</p>
            ) : blocked ? (
              <p className="text-sm text-river-800">
                We are closed on that date. Pick another day, or message us and we will find an
                option.
              </p>
            ) : loading ? (
              <p className="text-sm text-river-500">Checking the schedule…</p>
            ) : (slots ?? []).length === 0 ? (
              <p className="text-sm text-river-600">
                No departures are listed for that day yet — send your request and we will confirm a
                time on WhatsApp.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {(slots ?? []).map((slot) => {
                  const full = (slot.remaining ?? 1) === 0;
                  const active = time === slot.time;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={full}
                      aria-pressed={active}
                      onClick={() => setTime(slot.time)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        full
                          ? "border-river-100 bg-river-50 text-river-400"
                          : active
                            ? "border-river-600 bg-river-50 ring-1 ring-river-300"
                            : "border-river-200 bg-white hover:border-river-400"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{slot.time}</span>
                      <span className="block text-xs text-river-500">
                        {full
                          ? "Sold out"
                          : slot.remaining === null
                            ? "Seats available"
                            : `${slot.remaining} seats left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Step>

          <Step number={3} title="Guests">
            <Stepper
              label="Adult"
              hint={`${formatRupiah(unit)} per person`}
              value={adults}
              min={1}
              onChange={(value) => setAdults(Math.min(20, Math.max(1, value)))}
            />
            <Stepper
              label="Child (6–12)"
              hint={`${formatRupiah(childUnit)} per person`}
              value={children}
              min={0}
              onChange={(value) => setChildren(Math.min(20, Math.max(0, value)))}
            />
          </Step>

          <Step number={4} title="Extra details">
            <div className="rounded-xl bg-river-50/70 px-3 py-2.5 text-xs leading-relaxed text-river-700">
              <span className="font-semibold text-river-900">Good to know</span> — Meet at{" "}
              {meetingPoint || "the base camp"}. Please arrive 30 minutes before your start time.
              {option?.description ? ` ${option.description}` : ""}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-river-700">Your name</span>
                <input
                  value={guest.name}
                  onChange={(event) => setGuest({ ...guest, name: event.target.value })}
                  placeholder="Name on the booking"
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
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium text-river-700">Email (optional)</span>
                <input
                  type="email"
                  value={guest.email}
                  onChange={(event) => setGuest({ ...guest, email: event.target.value })}
                  placeholder="you@email.com"
                  className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2.5 text-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
                />
              </label>
            </div>

            {fields.map((field) => {
              const key = field.name || field.label;
              const value = answers[key] ?? "";

              return (
                <label key={key} className="mt-3 block">
                  <span className="text-xs font-medium text-river-700">
                    {field.label || field.name}
                    {field.required ? <span className="text-red-600"> *</span> : null}
                  </span>

                  {field.type === "Dropdown Selector" ? (
                    <select
                      value={value}
                      onChange={(event) => setAnswers({ ...answers, [key]: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-river-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
                    >
                      <option value="">Choose…</option>
                      {(field.options ?? []).map((choice) => (
                        <option key={choice} value={choice}>
                          {choice}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={value}
                      onChange={(event) => setAnswers({ ...answers, [key]: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2.5 text-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
                    />
                  )}
                </label>
              );
            })}

            <label className="mt-3 block">
              <span className="text-xs font-medium text-river-700">
                Special request (optional)
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, 150))}
                rows={2}
                placeholder="Example: first time rafting, allergies"
                className="mt-1 w-full rounded-xl border border-river-200 px-3 py-2.5 text-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
              />
              <span className="mt-1 block text-xs text-river-500">
                One line only. Maximum 150 characters.
              </span>
            </label>
          </Step>
        </div>

        <aside className="rounded-2xl border border-river-100 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold text-river-950">Your booking</h2>

          <ul className="mt-3 space-y-1.5 text-sm text-river-800">
            {duration ? <li>Duration: {duration}</li> : null}
            <li>
              {date ? formatLongDate(date) : "Choose a date"}
              {time ? ` at ${time}` : ""}
            </li>
            <li>Free cancellation until 24 hours before</li>
            {meetingPoint ? <li>Meeting point: {meetingPoint}</li> : null}
            {chosenChoice && (answers[chosenChoice.name || chosenChoice.label] ?? "") ? (
              <li>
                {chosenChoice.label || chosenChoice.name}:{" "}
                {answers[chosenChoice.name || chosenChoice.label]}
              </li>
            ) : null}
          </ul>

          <div className="mt-4 space-y-1 border-t border-river-100 pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-river-700">
                {adults} Adult × {formatRupiah(unit)}
              </span>
              <span className="font-medium">{formatRupiah(unit * adults)}</span>
            </div>
            {children > 0 ? (
              <div className="flex justify-between gap-3">
                <span className="text-river-700">
                  {children} Child × {formatRupiah(childUnit)}
                </span>
                <span className="font-medium">{formatRupiah(childUnit * children)}</span>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-3 pt-2">
              <span className="text-sm font-semibold text-river-950">Total</span>
              <span className="text-xl font-semibold text-river-950">{formatRupiah(total)}</span>
            </div>
            <p className="text-xs text-river-500">All taxes and fees included</p>
          </div>

          {error ? <p className="mt-3 text-xs font-medium text-red-700">{error}</p> : null}

          <button
            type="button"
            onClick={submit}
            disabled={submitting || party < 1}
            className="mt-4 w-full rounded-full bg-river-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-river-700 disabled:opacity-60"
          >
            {submitting ? "Reserving…" : "Continue to payment"}
          </button>
          <p className="mt-2 text-center text-xs text-river-500">
            Seats are held for 10 minutes while you book.
          </p>
        </aside>
      </div>
    </div>
  );
}
