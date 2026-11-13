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
const FIELD_TYPES = ["Text", "Number", "Dropdown", "Date"];

const emptyTier = (): TourTier => ({ name: "", price: 0, min: 1, max: 10, priceType: "Per person" });
const emptyField = (): TourOptionField => ({ label: "", type: "Text", required: true });

/**
 * The "Add option" window.
 *
 * It is opened from the tour editor's Price and availability tab in its own
 * browser window. There is no server round trip: the finished option is posted
 * back to the opener with postMessage and the window closes, so the editor can
 * show it in the table immediately and save it with the tour.
 */
export function TourOptionForm({ tourId, tourName }: { tourId: string; tourName: string }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tiers, setTiers] = useState<TourTier[]>([emptyTier()]);
  const [fields, setFields] = useState<TourOptionField[]>([]);
  const [status, setStatus] = useState("Active");
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

    const option: TourOption = {
      name: trimmedName,
      description: description.trim(),
      price: Number.isFinite(cheapest) ? cheapest : 0,
      field: keptTiers[0]?.priceType ?? "",
      tiers: keptTiers,
      fields: fields.filter((item) => item.label.trim()),
      active: status === "Active",
    };

    if (!window.opener) {
      setError("This window was not opened from the tour editor, so the option cannot be added.");
      return;
    }

    window.opener.postMessage({ type: "tour-price-option-saved", option }, window.location.origin);
    window.close();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 p-6 sm:p-10">
        <p className="text-sm text-river-500">Tour: {tourName}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-river-950">Add option</h1>

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
            <button type="button" onClick={() => setTiers((c) => [...c, emptyTier()])} className={dashedButton}>
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

          {fields.length > 0 ? (
            <div className="mt-2 overflow-hidden rounded-lg border border-river-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={thClass}>Label</th>
                    <th className={`${thClass} w-40`}>Type</th>
                    <th className={`${thClass} w-32`}>Required</th>
                    <th className={`${thClass} w-10`} />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((item, index) => (
                    <tr key={index} className="border-b border-river-100 last:border-0">
                      <td className="px-2 py-2">
                        <input
                          value={item.label}
                          onChange={(event) => patchField(index, { label: event.target.value })}
                          placeholder="Hotel name for pickup"
                          className={field}
                        />
                      </td>
                      <td className="px-2 py-2">
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
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={item.required ? "Yes" : "No"}
                          onChange={(event) => patchField(index, { required: event.target.value === "Yes" })}
                          className={field}
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          aria-label={`Remove field ${index + 1}`}
                          onClick={() => setFields((current) => current.filter((_, i) => i !== index))}
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
