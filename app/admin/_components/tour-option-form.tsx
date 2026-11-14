"use client";

import { useState } from "react";
import type { TourOption, TourOptionField, TourTier } from "@/lib/db-types";

const field =
  "mt-1 w-full rounded-lg border border-river-200 bg-white px-3 py-2.5 text-sm text-river-950 shadow-sm outline-none focus:border-river-500 focus:ring-2 focus:ring-river-200";
const labelClass = "text-xs font-medium text-river-600";
const thClass = "border-b border-river-100 bg-river-50/70 px-3 py-2 text-left text-xs font-medium text-river-500";
const iconButton =
  "grid size-8 place-items-center rounded-md text-river-400 transition-colors hover:bg-red-50 hover:text-red-700";
const dashedButton =
  "inline-flex items-center gap-1.5 rounded-lg border border-river-200 bg-white px-3 py-2 text-xs font-semibold text-river-800 transition-colors hover:bg-river-50";

const PRICE_TYPES = ["Per person", "Per booking", "Per group"];
const FIELD_TYPES = ["Text", "Dropdown Selector", "Read Only"];

const emptyTier = (): TourTier => ({ name: "", price: 0, min: 1, max: 10, priceType: "Per person" });
const emptyField = (): TourOptionField => ({
  name: "",
  label: "",
  text: "",
  type: "Text",
  options: [],
  required: true,
});

/**
 * The next tier starts where the previous one ends: after Min=1 Max=2 it is
 * filled in as Min=3, keeping the same span, so the ranges cannot overlap or
 * leave a gap as the list grows.
 */
function nextTier(current: TourTier[]): TourTier {
  const previous = current[current.length - 1];

  if (!previous) {
    return emptyTier();
  }

  const max = Math.max(0, Math.trunc(Number(previous.max) || 0));
  const min = Math.max(1, Math.trunc(Number(previous.min) || 0));
  const start = max + 1;

  return {
    name: "",
    price: 0,
    min: start,
    max: start + Math.max(0, max - min),
    priceType: previous.priceType || "Per person",
  };
}

/** Older options stored "Dropdown", "Number" or "Date"; keep a supported type. */
function fieldType(type: string): string {
  if (/read\s*-?\s*only|info|note/i.test(type)) {
    return "Read Only";
  }

  return /dropdown|select/i.test(type) ? "Dropdown Selector" : "Text";
}

/** Fields saved before names and choices existed still open in the editor. */
function readFields(list: TourOptionField[] | undefined): TourOptionField[] {
  return (list ?? []).filter(Boolean).map((item) => ({
    name: item.name ?? "",
    label: item.label ?? "",
    text: item.text ?? "",
    type: fieldType(item.type ?? ""),
    options: Array.isArray(item.options) ? item.options : [],
    required: item.required !== false,
  }));
}

/**
 * The option window.
 *
 * It is opened from the tour editor's Price and availability tab in its own
 * browser window, either empty (Add) or pre-filled from an existing row (Edit).
 * There is no server round trip: the finished option is posted back to the
 * opener with postMessage and the window closes, so the editor can show it in
 * the table immediately and save it with the tour.
 */
export function TourOptionForm({
  tourId,
  tourName,
  option,
  optionIndex,
}: {
  tourId: string;
  tourName: string;
  /** Set when the window was opened from an existing row (`?index=`). */
  option?: TourOption;
  optionIndex?: number;
}) {
  const editing = optionIndex !== undefined;
  // Options saved before tiers existed only carry a single price and field.
  const initialTiers: TourTier[] = option
    ? option.tiers?.length
      ? option.tiers.map((tier) => ({ ...tier }))
      : [
          {
            name: "Adult",
            price: option.price || 0,
            min: 1,
            max: 10,
            priceType: option.field || "Per person",
          },
        ]
    : [emptyTier()];

  const [name, setName] = useState(option?.name ?? "");
  const [description, setDescription] = useState(option?.description ?? "");
  const [tiers, setTiers] = useState<TourTier[]>(initialTiers);
  const [fields, setFields] = useState<TourOptionField[]>(readFields(option?.fields));
  const [status, setStatus] = useState(option?.active === false ? "Inactive" : "Active");
  const [error, setError] = useState<string | null>(null);

  const patchTier = (index: number, patch: Partial<TourTier>) => {
    setTiers((current) =>
      current.map((tier, position) => (position === index ? { ...tier, ...patch } : tier)),
    );
  };

  const patchField = (index: number, patch: Partial<TourOptionField>) => {
    setFields((current) =>
      current.map((item, position) => (position === index ? { ...item, ...patch } : item)),
    );
  };

  const close = () => {
    if (window.opener) {
      window.close();
      return;
    }

    window.location.href = `/admin/tours/${tourId}`;
  };

  const save = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Give the option a name, e.g. “Rafting + lunch”.");
      return;
    }

    const keptTiers = tiers.filter((tier) => tier.name.trim() || tier.price > 0);
    const cheapest = keptTiers.reduce(
      (min, tier) => (tier.price > 0 && tier.price < min ? tier.price : min),
      Number.POSITIVE_INFINITY,
    );

    const saved: TourOption = {
      name: trimmedName,
      description: description.trim(),
      price: Number.isFinite(cheapest) ? cheapest : 0,
      field: keptTiers[0]?.priceType ?? "",
      tiers: keptTiers,
      fields: fields
        .filter((item) => item.label.trim() || (item.text ?? "").trim() || item.name.trim())
        .map((item) => ({
          ...item,
          name: item.name.trim(),
          label: item.label.trim(),
          text: (item.text ?? "").trim(),
          options:
            item.type === "Dropdown Selector"
              ? item.options.map((choice) => choice.trim()).filter(Boolean)
              : [],
          // A read-only field is information for the guest, never a question.
          required: item.type === "Read Only" ? false : item.required,
        })),
      active: status === "Active",
    };

    if (!window.opener) {
      setError("This window was not opened from the tour editor, so the option cannot be saved.");
      return;
    }

    window.opener.postMessage(
      { type: "tour-price-option-saved", option: saved, index: optionIndex },
      window.location.origin,
    );
    window.close();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 p-6 sm:p-10">
        <p className="text-sm text-river-500">Tour: {tourName}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-river-950">
          {editing ? "Edit option" : "Add option"}
        </h1>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className={labelClass}>Option name</span>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="Rafting + lunch"
              className={field}
              autoFocus
            />
          </label>

          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Includes river rafting, guide, safety gear, shower and Balinese lunch."
              className={field}
            />
            <span className="mt-1 block text-xs text-river-500">
              Shown under the option on the tour page. Plain text.
            </span>
          </label>
        </div>

        {/* Tier price */}
        <div className="mt-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-river-950">Tier price</h2>
            <button type="button" onClick={() => setTiers((current) => [...current, nextTier(current)])} className={dashedButton}>
              + Add tier
            </button>
          </div>

          <div className="mt-2 overflow-hidden rounded-lg border border-river-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={thClass}>Tier name</th>
                  <th className={thClass}>Price (IDR)</th>
                  <th className={`${thClass} w-20`}>Min</th>
                  <th className={`${thClass} w-20`}>Max</th>
                  <th className={thClass}>Price type</th>
                  <th className={`${thClass} w-10`} />
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, index) => (
                  <tr key={index} className="border-b border-river-100 last:border-0">
                    <td className="px-2 py-2">
                      <input
                        value={tier.name}
                        onChange={(event) => patchTier(index, { name: event.target.value })}
                        placeholder="Adult"
                        className={field}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={tier.price || ""}
                        onChange={(event) =>
                          patchTier(index, { price: Math.max(0, Math.trunc(Number(event.target.value) || 0)) })
                        }
                        placeholder="450000"
                        className={field}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={tier.min}
                        onChange={(event) =>
                          patchTier(index, { min: Math.max(0, Math.trunc(Number(event.target.value) || 0)) })
                        }
                        className={field}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={tier.max}
                        onChange={(event) =>
                          patchTier(index, { max: Math.max(0, Math.trunc(Number(event.target.value) || 0)) })
                        }
                        className={field}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={tier.priceType}
                        onChange={(event) => patchTier(index, { priceType: event.target.value })}
                        className={field}
                      >
                        {PRICE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        aria-label={`Remove tier ${index + 1}`}
                        onClick={() =>
                          setTiers((current) =>
                            current.length > 1 ? current.filter((_, i) => i !== index) : current,
                          )
                        }
                        className={iconButton}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guest fields */}
        <div className="mt-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-river-950">Field</h2>
            <button type="button" onClick={() => setFields((c) => [...c, emptyField()])} className={dashedButton}>
              + Add field
            </button>
          </div>
          <p className="mt-1 text-xs text-river-500">
            The type decides how the guest answers: a plain Text box, a Dropdown Selector with one
            choice per line, or Read Only to show the text as information without asking anything.
            Label is the short heading on one line; the text under it is what the guest reads and
            may run over several lines.
          </p>

          {fields.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {fields.map((item, index) => (
                <li key={index} className="rounded-lg border border-river-200 p-3">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,12rem)_8rem]">
                    <label className="block">
                      <span className={labelClass}>Type</span>
                      <select
                        value={item.type}
                        onChange={(event) => patchField(index, { type: event.target.value })}
                        className={field}
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className={labelClass}>Required</span>
                      <select
                        value={item.required ? "Yes" : "No"}
                        onChange={(event) =>
                          patchField(index, { required: event.target.value === "Yes" })
                        }
                        className={field}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </label>
                  </div>

                  <label className="mt-2 block">
                    <span className={labelClass}>Label</span>
                    <input
                      value={item.label}
                      onChange={(event) => patchField(index, { label: event.target.value })}
                      placeholder="Hotel name"
                      className={field}
                    />
                    <span className="mt-1 block text-xs text-river-500">
                      The short heading on the booking page. One line.
                    </span>
                  </label>

                  <label className="mt-2 block">
                    <span className={labelClass}>Text showing to the customer</span>
                    <textarea
                      value={item.text ?? ""}
                      onChange={(event) => patchField(index, { text: event.target.value })}
                      rows={3}
                      placeholder={
                        "What the guest should read here. Use more lines\nwhen the text is long."
                      }
                      className={field}
                    />
                    <span className="mt-1 block text-xs text-river-500">
                      Shown under the label on the booking page. It may run over several lines.
                    </span>
                  </label>

                  {item.type === "Read Only" ? (
                    <p className="mt-2 rounded-md bg-river-50 px-2.5 py-2 text-xs text-river-600">
                      Shown to the guest as information — the text is what they read, and no answer
                      is collected.
                    </p>
                  ) : null}

                  {item.type === "Dropdown Selector" ? (
                    <label className="mt-2 block">
                      <span className={labelClass}>Choices</span>
                      <textarea
                        value={item.options.join("\n")}
                        onChange={(event) =>
                          patchField(index, { options: event.target.value.split("\n") })
                        }
                        rows={3}
                        placeholder={"Rafting only\nRafting + lunch\nRafting + lunch + transfer"}
                        className={field}
                      />
                      <span className="mt-1 block text-xs text-river-500">
                        One choice per line — these become the dropdown entries.
                      </span>
                    </label>
                  ) : null}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-river-400">
                      {item.type === "Dropdown Selector"
                        ? `${item.options.filter((choice) => choice.trim()).length} choice(s)`
                        : item.type === "Read Only"
                          ? "Information only"
                          : "Guest types the answer"}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove field ${index + 1}`}
                      onClick={() => setFields((current) => current.filter((_, i) => i !== index))}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-river-500 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      ✕ Remove field
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 rounded-lg border border-dashed border-river-200 bg-river-50/50 px-3 py-3 text-xs text-river-500">
              No guest fields. Add one when the option needs extra information, such as a pickup
              hotel or a meal choice.
            </p>
          )}
        </div>

        <div className="mt-7 flex items-center gap-3">
          <span className={labelClass}>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={`${field} mt-0 w-40`}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="border-t border-river-100 px-6 py-4 sm:px-10">
        {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-river-200 bg-white px-5 py-2.5 text-sm font-medium text-river-800 transition-colors hover:bg-river-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-river-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-river-800"
          >
            Save option
          </button>
        </div>
      </div>
    </div>
  );
}
