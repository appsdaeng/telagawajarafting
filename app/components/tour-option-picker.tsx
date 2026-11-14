"use client";

import { useState } from "react";
import { formatRupiah, whatsappLink } from "@/lib/tours";
import { tomorrowDate, useTourBooking } from "@/app/components/tour-booking";

export type PickerOption = {
  name: string;
  description: string;
  field: string;
  price: number;
  /** Set in Admin → Tours → Price and availability; false hides the option. */
  active?: boolean;
};

type Props = {
  tourName: string;
  siteName: string;
  options: PickerOption[];
  adultPrice: number;
  childPrice: number;
};

function PeopleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0" fill="currentColor">
      <path d="M7 9.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Zm0 1.25c-2.3 0-4.5 1.2-4.5 2.9v1.1h9V13.6c0-1.7-2.2-2.85-4.5-2.85Zm6.6-1.35a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Zm.4 1.35c-.5 0-1 .06-1.4.18.9.75 1.3 1.7 1.3 2.67v1.15H17v-1.15c0-1.6-1.7-2.85-3-2.85Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="mt-0.5 size-4 shrink-0 text-emerald-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="7.25" />
      <path d="m6.75 10.25 2.2 2.2 4.3-4.4" />
    </svg>
  );
}

function Counter({
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
    <div className="flex items-center justify-between gap-3 py-2">
      <span>
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
        <span aria-live="polite" className="w-8 text-center text-sm font-semibold tabular-nums">
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
 * Price panel for a tour page.
 *
 * It holds only what the guest must decide here — the date and how many people
 * are coming — and shows the cheapest price as "From". The options themselves
 * appear in the page body under Highlights once Check availability is pressed,
 * so the panel stays short.
 */
export function TourOptionPicker({
  tourName,
  siteName,
  options,
  adultPrice,
  childPrice,
}: Props) {
  const { date, setDate, minDate, adults, children, setAdults, setChildren, reveal } =
    useTourBooking();
  const [open, setOpen] = useState(true);

  // Options switched to Inactive stay on the tour but are never offered here.
  const visible = options.filter((option) => option.active !== false);
  const cheapest = visible.reduce(
    (min, option) => (option.price > 0 && option.price < min ? option.price : min),
    Number.POSITIVE_INFINITY,
  );
  const perPerson = Number.isFinite(cheapest) ? cheapest : adultPrice;
  // A child price only exists on the tour itself; an option is per person.
  const childUnit = visible.length > 0 ? perPerson : childPrice;
  const total = perPerson * adults + childUnit * children;

  const message = `Hi ${siteName}, I would like to book ${tourName}. Date: ${
    date || "___"
  }, people: ${adults} adult${adults === 1 ? "" : "s"}${children ? `, ${children} child` : ""}.`;

  return (
    <>
      <div className="mt-4 flex items-baseline justify-between gap-4 border-b border-river-100 pb-3">
        <span className="text-sm text-river-800">From</span>
        <span className="text-2xl font-semibold">{formatRupiah(perPerson)}</span>
      </div>
      <p className="mt-1 text-xs text-river-500">per person for the selected option</p>

      <label className="mt-4 block">
        <span className="text-sm font-semibold tracking-tight text-river-900">Select date</span>
        <input
          type="date"
          value={date}
          min={minDate || undefined}
          onChange={(event) => setDate(event.target.value)}
          className="mt-2 w-full rounded-xl border border-river-200 bg-white px-3 py-2.5 text-sm text-river-950 shadow-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200"
        />
      </label>

      {/* Participants */}
      <div className="mt-3 overflow-hidden rounded-xl border border-river-200">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-river-900 transition-colors hover:bg-river-50"
        >
          <PeopleIcon />
          Participants
          <span className="ml-auto text-xs font-normal text-river-500">
            {adults} adult{adults === 1 ? "" : "s"}
            {children ? ` · ${children} child${children === 1 ? "" : "ren"}` : ""}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`size-4 shrink-0 text-river-500 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 8 4 4 4-4" />
          </svg>
        </button>

        {open ? (
          <div className="border-t border-river-100 px-3 pt-1 pb-3">
            <Counter label="Adult" hint="Age 12–65" value={adults} min={1} onChange={setAdults} />
            <Counter
              label="Child"
              hint="Age 11 and younger"
              value={children}
              min={0}
              onChange={setChildren}
            />
            <p className="mt-2 text-xs text-river-500">Ages older than 66 are not permitted.</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full rounded-full bg-river-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-river-700"
            >
              Continue
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-4 text-sm">
        <span className="text-river-700">
          {adults} adult{adults === 1 ? "" : "s"}
          {children ? ` · ${children} child${children === 1 ? "" : "ren"}` : ""}
        </span>
        <span className="font-semibold">{formatRupiah(total)}</span>
      </div>
      <p className="mt-1 text-xs text-river-500">
        Prices per person, including equipment, guide, lunch and hotel pickup.
      </p>

      <button
        type="button"
        onClick={() => {
          if (!date) setDate(tomorrowDate());
          reveal();
        }}
        className="mt-4 block w-full rounded-full bg-river-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-river-700"
      >
        Check availability
      </button>

      <ul className="mt-4 space-y-3 border-t border-river-100 pt-4">
        <li className="flex gap-2.5">
          <CheckIcon />
          <div>
            <p className="text-sm font-semibold text-river-900">Free cancellation</p>
            <p className="text-xs leading-relaxed text-river-600">
              Cancel up to 24 hours in advance for a full refund
            </p>
          </div>
        </li>
        <li className="flex gap-2.5">
          <CheckIcon />
          <div>
            <p className="text-sm font-semibold text-river-900">Easy payment</p>
            <p className="text-xs leading-relaxed text-river-600">
              Easy Payment method with Card, PayPal, QR, E-Wallet, Google Pay, Apple Pay, Cash on
              Arrival
            </p>
          </div>
        </li>
      </ul>

      <a
        href={whatsappLink(message)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block rounded-full border border-river-300 px-5 py-2.5 text-center text-sm font-semibold text-river-800 transition-colors hover:bg-river-50"
      >
        Ask on WhatsApp
      </a>
    </>
  );
}
