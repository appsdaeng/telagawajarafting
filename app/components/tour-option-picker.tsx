"use client";

import { useState } from "react";
import { formatRupiah, whatsappLink } from "@/lib/tours";

export type PickerOption = {
  name: string;
  description: string;
  field: string;
  price: number;
  /** Set in Admin → Tours → Price and availability; false hides the option. */
  active?: boolean;
};

type Props = {
  tourSlug: string;
  tourName: string;
  siteName: string;
  options: PickerOption[];
  adultPrice: number;
  childPrice: number;
};

/**
 * Price panel for a tour page: the guest picks a bookable option, the price
 * updates, and the chosen option is carried through to the booking widget with
 * `?option=…` so the reservation is created against the same option.
 */
export function TourOptionPicker({
  tourSlug,
  tourName,
  siteName,
  options,
  adultPrice,
  childPrice,
}: Props) {
  const [selected, setSelected] = useState(0);
  // Options switched to Inactive stay on the tour but are never offered here.
  const visible = options.filter((option) => option.active !== false);
  const chosen = visible[selected] ?? null;
  const perPerson = chosen && chosen.price > 0 ? chosen.price : adultPrice;

  const bookingHref = `/?tour=${encodeURIComponent(tourSlug)}${
    chosen ? `&option=${encodeURIComponent(chosen.name)}` : ""
  }#book`;

  const message = `Hi ${siteName}, I would like to book ${tourName}${
    chosen ? ` — ${chosen.name}` : ""
  }. Date: ___, people: ___.`;

  return (
    <>
      {visible.length > 0 ? (
        <>
          <div className="mt-4 flex items-baseline justify-between gap-4 border-b border-river-100 pb-3">
            <span className="text-sm text-river-800">From</span>
            <span className="text-2xl font-semibold">{formatRupiah(perPerson)}</span>
          </div>
          <p className="mt-1 text-xs text-river-500">per person for the selected option</p>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold tracking-tight">Choose an option</legend>
            <div className="mt-3 space-y-2">
              {visible.map((option, index) => {
                const active = index === selected;

                return (
                  <label
                    key={`${index}-${option.name}`}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                      active
                        ? "border-river-500 bg-river-50 ring-1 ring-river-200"
                        : "border-river-100 hover:border-river-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tour-option"
                      checked={active}
                      onChange={() => setSelected(index)}
                      className="mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium text-river-900">
                          {option.name || "Option"}
                        </span>
                        {option.price > 0 ? (
                          <span className="text-sm font-semibold">{formatRupiah(option.price)}</span>
                        ) : null}
                      </span>
                      {option.field ? (
                        <span className="block text-xs font-medium text-river-500">
                          {option.field}
                        </span>
                      ) : null}
                      {option.description ? (
                        <span className="mt-1 block text-xs leading-relaxed text-river-700">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </>
      ) : (
        <dl className="mt-4 space-y-3">
          <div className="flex items-baseline justify-between gap-4 border-b border-river-100 pb-3">
            <dt className="text-sm text-river-800">Adult</dt>
            <dd className="text-xl font-semibold">{formatRupiah(adultPrice)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-river-800">Child (7–12)</dt>
            <dd className="text-xl font-semibold">{formatRupiah(childPrice)}</dd>
          </div>
        </dl>
      )}

      <p className="mt-3 text-xs text-river-600">
        Prices per person, including equipment, guide, lunch and hotel pickup. Paid at base camp on
        the day — no card details online.
      </p>
      <a
        href={bookingHref}
        className="mt-6 block rounded-full bg-river-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-river-700"
      >
        Check availability
      </a>
      <a
        href={whatsappLink(message)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block rounded-full border border-river-300 px-5 py-2.5 text-center text-sm font-semibold text-river-800 transition-colors hover:bg-river-50"
      >
        Ask on WhatsApp
      </a>
    </>
  );
}
