"use client";

import { useState } from "react";
import type { TourTier } from "@/lib/db-types";
import { formatRupiah } from "@/lib/tours";
import { tierForParty } from "@/lib/tour-options";
import { useTourBooking } from "@/app/components/tour-booking";

export type AvailabilityOption = {
  name: string;
  description: string;
  price: number;
  /** Price bands by party size, set in Admin → Tours → Price and availability. */
  tiers?: TourTier[];
  /** Tier label of the first price band, e.g. "Per person". */
  field?: string;
  /** Set in Admin → Tours → Price and availability; false hides the option. */
  active?: boolean;
};

type Props = {
  tourSlug: string;
  options: AvailabilityOption[];
  duration: string;
  meetingPoint: string;
  adultPrice: number;
};

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** The last day a booking can be cancelled without a charge: one day before. */
function freeCancellationUntil(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() - 1);
  return formatDate(date.toISOString().slice(0, 10));
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-river-800">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-river-600">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

const iconProps = {
  viewBox: "0 0 20 20",
  className: "size-4",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4.2l2.6 1.6" />
    </svg>
  );
}

function CalendarCheckIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.25" y="4.75" width="13.5" height="12" rx="2" />
      <path d="M3.25 8.25h13.5M6.75 3.5v2.5M13.25 3.5v2.5m-3.4 6.2 1.6 1.6 2.8-2.9" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10 17s5.25-4.3 5.25-8.1A5.25 5.25 0 0 0 4.75 8.9C4.75 12.7 10 17 10 17Z" />
      <circle cx="10" cy="8.7" r="1.9" />
    </svg>
  );
}

/**
 * The options a guest can pick, shown under Highlights in the page body.
 *
 * Hidden until Check availability is pressed in the price panel: before that
 * the panel only asks for the date and the number of people, and this section
 * answers them with every bookable option and its price for that party.
 */
export function TourAvailability({
  tourSlug,
  options,
  duration,
  meetingPoint,
  adultPrice,
}: Props) {
  const { date, adults, children, showOptions } = useTourBooking();
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState<number[]>([]);

  if (!showOptions) {
    return null;
  }

  const visible = options.filter((option) => option.active !== false);
  const party = adults + children;

  const toggle = (index: number) =>
    setExpanded((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );

  return (
    <section id="availability" className="mt-10 scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Available options</h2>
        {date ? (
          <p className="text-xs text-river-600">
            {formatDate(date)} · {adults} adult{adults === 1 ? "" : "s"}
            {children ? `, ${children} child${children === 1 ? "" : "ren"}` : ""}
          </p>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-river-100 bg-river-50/60 px-4 py-3 text-sm text-river-700">
          No options are published for this tour yet. Ask us on WhatsApp and we will arrange your
          trip.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {visible.map((option, index) => {
            const active = index === selected;
            const tier = tierForParty(option, party);
            // A priced tier list decides the price for this party size; when
            // none covers it, the option is not offered for that many guests.
            const covered = !option.tiers?.length || Boolean(tier);
            const unit = tier?.price || (option.price > 0 ? option.price : adultPrice);
            const total = unit * party;
            const long = option.description.length > 140;
            const open = expanded.includes(index);

            return (
              <article
                key={`${index}-${option.name}`}
                className={`flex flex-col rounded-2xl border p-4 transition-colors ${
                  active ? "border-river-500 ring-1 ring-river-300" : "border-river-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-river-950">{option.name || "Option"}</h3>
                  <button
                    type="button"
                    aria-label={`Choose ${option.name || "this option"}`}
                    aria-pressed={active}
                    onClick={() => setSelected(index)}
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${
                      active ? "border-river-600 bg-river-600" : "border-river-300 hover:border-river-500"
                    }`}
                  >
                    {active ? (
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3.5 8.5 3 3 6-6.5" />
                      </svg>
                    ) : null}
                  </button>
                </div>

                {option.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-river-700">
                    {long && !open ? `${option.description.slice(0, 130).trimEnd()}… ` : option.description}
                    {long ? (
                      <button
                        type="button"
                        onClick={() => toggle(index)}
                        className="font-semibold text-river-900 underline underline-offset-2 hover:no-underline"
                      >
                        {open ? " Read less" : " Read more"}
                      </button>
                    ) : null}
                  </p>
                ) : null}

                <ul className="mt-4 space-y-2 border-t border-river-100 pt-3">
                  <Meta icon={<ClockIcon />}>Duration: {duration}</Meta>
                  <Meta icon={<CalendarCheckIcon />}>
                    Cancel for free until {freeCancellationUntil(date) || "24 hours before"}
                  </Meta>
                  <Meta icon={<PinIcon />}>
                    {/transfer|pickup|pick-up/i.test(`${option.name} ${option.description}`)
                      ? "Pickup area: hotel lobby, confirmed on WhatsApp"
                      : `Meeting point: ${meetingPoint}`}
                  </Meta>
                </ul>

                <div className="mt-auto pt-4">
                  {covered ? (
                    <>
                      <p className="text-lg font-semibold">{formatRupiah(total)}</p>
                      <p className="text-xs text-river-600">
                        {party} {party === 1 ? "guest" : "guests"} × {formatRupiah(unit)}
                        {tier?.name ? ` · ${tier.name}` : option.field ? ` · ${option.field}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-river-500">All taxes and fees included</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-river-500">Ask us</p>
                      <p className="text-xs text-river-600">
                        Not bookable online for {party} {party === 1 ? "guest" : "guests"}. Message
                        us and we will arrange it.
                      </p>
                    </>
                  )}

                  {active && covered ? (
                    <a
                      href={`/tours/${encodeURIComponent(tourSlug)}/book?option=${encodeURIComponent(
                        option.name,
                      )}&date=${date}&adults=${adults}&children=${children}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => {
                        // The booking opens in its own window so the guest keeps
                        // the tour page exactly where they left it.
                        event.preventDefault();
                        window.open(
                          event.currentTarget.href,
                          "tour-booking",
                          "popup=yes,width=1080,height=920",
                        );
                      }}
                      className="mt-3 block rounded-full bg-river-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-river-700"
                    >
                      Continue
                    </a>
                  ) : covered ? (
                    <button
                      type="button"
                      onClick={() => setSelected(index)}
                      className="mt-3 block w-full rounded-full border border-river-300 px-5 py-3 text-center text-sm font-semibold text-river-800 transition-colors hover:bg-river-50"
                    >
                      Select
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
