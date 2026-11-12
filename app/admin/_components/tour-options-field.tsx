"use client";

import { useState } from "react";
import type { TourOption } from "@/lib/db-types";
import { buttonSecondary, inputClass, labelClass } from "@/app/admin/_components/ui";

const emptyOption = (): TourOption => ({
  name: "",
  description: "",
  price: 0,
  field: "",
});

function isBlank(option: TourOption): boolean {
  return !option.name.trim() && !option.description.trim() && !option.price && !option.field.trim();
}

/**
 * Bookable options for a tour — the variants a guest picks between, such as
 * "Rafting only" and "Rafting with hotel transfer".
 *
 * Each card is one option: name, description (what it includes), tier price and
 * the field it applies to (e.g. per person). The whole list is posted as JSON in
 * `pricing_options`; the save action validates it and stores it on the tour.
 * Date-based peak prices belong in Availability, not here.
 */
export function TourOptionsField({ defaultValue }: { defaultValue?: TourOption[] | null }) {
  const [options, setOptions] = useState<TourOption[]>(() =>
    (defaultValue ?? []).map((option) => ({
      name: option?.name ?? "",
      description: option?.description ?? "",
      price: Number(option?.price) || 0,
      field: option?.field ?? "",
    })),
  );

  const update = (index: number, patch: Partial<TourOption>) => {
    setOptions((current) =>
      current.map((option, position) => (position === index ? { ...option, ...patch } : option)),
    );
  };

  const addOption = () => setOptions((current) => [...current, emptyOption()]);

  const removeOption = (index: number) => {
    setOptions((current) => current.filter((_, position) => position !== index));
  };

  const value = JSON.stringify(options.filter((option) => !isBlank(option)));

  return (
    <div className="block">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className={labelClass}>Tour options</span>
          <p className="mt-1 text-xs text-river-500">
            The variants a guest can book, such as “Rafting only” or “Rafting with hotel
            transfer”. Each option carries its own description and tier price, which become the
            selectable options on the tour page. Leave empty when the adult and child prices are
            the only choice.
          </p>
        </div>
        <button type="button" onClick={addOption} className={buttonSecondary}>
          + Add new option
        </button>
      </div>

      {options.length === 0 ? (
        <div className="mt-3 grid place-items-center rounded-xl border border-dashed border-river-200 bg-river-50 px-4 py-6 text-xs text-river-400">
          No options yet
        </div>
      ) : (
        <ol className="mt-3 space-y-3">
          {options.map((option, index) => (
            <li
              key={index}
              className="rounded-xl border border-river-100 bg-river-50/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-river-700">Option {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-xs font-medium text-red-700 underline"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Option name</span>
                  <input
                    value={option.name}
                    onChange={(event) => update(index, { name: event.target.value })}
                    placeholder="Private group"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Field</span>
                  <input
                    value={option.field}
                    onChange={(event) => update(index, { field: event.target.value })}
                    placeholder="Per person / per group"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Tier price (IDR)</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={option.price}
                    onChange={(event) =>
                      update(index, { price: Math.max(0, Math.trunc(Number(event.target.value) || 0)) })
                    }
                    className={inputClass}
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className={labelClass}>Description</span>
                  <textarea
                    rows={2}
                    value={option.description}
                    onChange={(event) => update(index, { description: event.target.value })}
                    placeholder="What this option includes, e.g. pickup from Ubud, Kuta and Seminyak plus lunch…"
                    className={inputClass}
                  />
                </label>
              </div>
            </li>
          ))}
        </ol>
      )}

      <input type="hidden" name="pricing_options" value={value} readOnly />
    </div>
  );
}
