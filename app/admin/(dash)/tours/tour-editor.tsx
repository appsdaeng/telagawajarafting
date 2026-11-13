"use client";

import { useEffect, useMemo, useState } from "react";
import type { TourOption, TourRow } from "@/lib/db-types";
import { RichTextField } from "@/app/admin/_components/rich-text";
import { ItineraryField } from "@/app/admin/_components/itinerary-field";
import { TourGalleryField } from "@/app/admin/_components/tour-gallery-field";
import { inputClass, labelClass } from "@/app/admin/_components/ui";
import { saveTourWithRichTextAction } from "./save-tour";

type TabKey = "general" | "content" | "pricing";

const TABS: { key: TabKey; label: string }[] = [
  { key: "general", label: "General" },
  { key: "content", label: "Highlight and itinerary" },
  { key: "pricing", label: "Price and availability" },
];

const cardClass = "rounded-2xl border border-river-100 bg-white p-5 shadow-sm";
const sectionTitle = "text-sm font-semibold tracking-tight text-river-950";
const hintClass = "mt-1 block text-xs text-river-500";
const plansTh =
  "border-b border-river-100 bg-river-50/70 px-3 py-2 text-left text-xs font-medium text-river-500";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Rough readiness score, mirroring the checklist below it. */
function seoScore(checks: { ok: boolean; weight: number }[]): number {
  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0);
  return Math.round((earned / total) * 100);
}

export function TourEditor({
  tour,
  uploadHint,
}: {
  tour?: TourRow;
  uploadHint: string | null;
}) {
  const [tab, setTab] = useState<TabKey>("general");
  const [name, setName] = useState(tour?.name ?? "");
  const [slug, setSlug] = useState(tour?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(tour?.slug));
  const [shortDescription, setShortDescription] = useState(tour?.description ?? "");
  const [seoTitle, setSeoTitle] = useState(tour?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(tour?.seo_description ?? "");
  const [imageAlt, setImageAlt] = useState(tour?.image_alt ?? "");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [dirty, setDirty] = useState(false);
  const [options, setOptions] = useState<TourOption[]>(() =>
    (tour?.pricing_options ?? []).map((option) => ({ ...option, active: option.active !== false })),
  );

  // The option window posts the finished option back here, then closes itself.
  // With an index it replaces that row, otherwise it appends a new option.
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const data = event.data as { type?: string; option?: TourOption; index?: number } | null;

      if (data?.type !== "tour-price-option-saved" || !data.option) return;

      const saved = data.option;
      const index = data.index;

      setOptions((current) =>
        typeof index === "number" && index >= 0 && index < current.length
          ? current.map((item, position) => (position === index ? saved : item))
          : [...current, saved],
      );
      setDirty(true);
    };

    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  /** Opens the option window; pass the row position to edit it, or nothing to add. */
  const openOptionWindow = (index?: number) => {
    if (!tour) return;

    const query = typeof index === "number" ? `?index=${index}` : "";

    window.open(
      `/admin/tours/${tour.id}/options/new${query}`,
      `tour-option-${tour.id}`,
      "width=1000,height=920,menubar=no,toolbar=no,location=no,status=no",
    );
  };

  const effectiveSlug = slugTouched ? slug : slugify(name);

  useEffect(() => {
    if (!dirty) return;

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const checks = useMemo(() => {
    const keyword = focusKeyword.trim().toLowerCase();
    const titleLower = seoTitle.toLowerCase();
    const descriptionLower = seoDescription.toLowerCase();

    return [
      {
        label: "Page title between 30 and 60 characters",
        ok: seoTitle.length >= 30 && seoTitle.length <= 60,
        weight: 2,
      },
      {
        label: "Meta description between 80 and 160 characters",
        ok: seoDescription.length >= 80 && seoDescription.length <= 160,
        weight: 2,
      },
      { label: "Photo alt text describes the image", ok: imageAlt.trim().length >= 10, weight: 1 },
      {
        label: keyword ? "Focus keyword appears in the title" : "Set a focus keyword",
        ok: keyword ? titleLower.includes(keyword) : false,
        weight: 1,
      },
      {
        label: keyword ? "Focus keyword appears in the meta description" : "Short description written",
        ok: keyword ? descriptionLower.includes(keyword) : shortDescription.trim().length > 20,
        weight: 1,
      },
      { label: "URL slug is readable", ok: effectiveSlug.length >= 3, weight: 1 },
      {
        label: "Short description under 160 characters",
        ok: shortDescription.length > 0 && shortDescription.length <= 160,
        weight: 1,
      },
    ];
  }, [effectiveSlug, focusKeyword, imageAlt, seoDescription, seoTitle, shortDescription]);

  const score = seoScore(checks);
  const scoreTone = score >= 80 ? "text-emerald-700" : score >= 50 ? "text-amber-700" : "text-red-700";
  const incomplete = checks.filter((check) => !check.ok);

  return (
    <form
      action={saveTourWithRichTextAction}
      className="space-y-5"
      onInput={() => setDirty(true)}
      onChange={() => setDirty(true)}
    >
      {tour ? <input type="hidden" name="id" value={tour.id} /> : null}

      {/* Tabs */}
      <div className="border-b border-river-200">
        <nav className="-mb-px flex flex-wrap gap-6" aria-label="Tour sections">
          {TABS.map((item) => {
            const active = item.key === tab;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                aria-current={active ? "page" : undefined}
                className={`-mb-px border-b-2 pb-2.5 text-sm transition-colors ${
                  active
                    ? "border-river-950 font-semibold text-river-950"
                    : "border-transparent text-river-600 hover:text-river-900"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* General */}
      <div className={tab === "general" ? "space-y-5" : "hidden"}>
        <div className={cardClass}>
          <h2 className={sectionTitle}>Essentials</h2>

          <div className="mt-3 space-y-4">
            <label className="block">
              <span className={labelClass}>Tour title</span>
              <input
                name="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Telaga Waja Rafting"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>URL slug</span>
              <div className="mt-1 flex items-stretch overflow-hidden rounded-lg border border-river-200 bg-white shadow-sm focus-within:border-river-500 focus-within:ring-2 focus-within:ring-river-200">
                <span className="grid place-items-center border-r border-river-100 bg-river-50 px-3 text-xs text-river-500">
                  /tours/
                </span>
                <input
                  name="slug"
                  value={effectiveSlug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(slugify(event.target.value));
                  }}
                  placeholder="telaga-waja-rafting"
                  className="w-full border-0 px-3 py-2 text-sm text-river-950 outline-none"
                />
              </div>
              <span className={hintClass}>
                Generated from the title until you edit it. Lowercase words with hyphens.
                {tour && tour.slug !== effectiveSlug
                  ? " Changing a published slug moves the page, so link the old URL somewhere new."
                  : ""}
              </span>
            </label>

            <label className="block">
              <span className={labelClass}>Tagline</span>
              <input
                name="tagline"
                defaultValue={tour?.tagline}
                placeholder="Bali's longest white water rafting run"
                className={inputClass}
              />
              <span className={hintClass}>One line under the title on the tour page.</span>
            </label>

            <label className="block">
              <span className={labelClass}>Short description</span>
              <textarea
                name="description"
                rows={2}
                maxLength={160}
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                placeholder="Two hours on the river, through rice terraces and jungle…"
                className={inputClass}
              />
              <span className="mt-1 flex items-center justify-between text-xs">
                <span className="text-river-500">Used on tour cards and in search results.</span>
                <span className={shortDescription.length > 160 ? "text-red-700" : "text-river-500"}>
                  {shortDescription.length}/160
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className={sectionTitle}>Full description</h2>
          <p className={hintClass}>
            One paragraph per line. This is the story on the tour page, below the highlights.
          </p>
          <div className="mt-3">
            <RichTextField
              name="story"
              label="Story"
              placeholder="Write a paragraph, then press Enter for the next one…"
              defaultValue={tour?.story}
              multiple
              addLabel="Add paragraph"
            />
          </div>
        </div>

        <div className={cardClass}>
          <h2 className={sectionTitle}>Photos</h2>
          <p className={hintClass}>
            The cover is used on the cards, banner and share image. Add more for the gallery.
          </p>
          <div className="mt-3 space-y-4">
            <TourGalleryField
              coverDefault={tour?.image_url}
              galleryDefault={tour?.gallery_urls}
              uploadHint={uploadHint}
            />
            <label className="block">
              <span className={labelClass}>Photo alt text</span>
              <input
                name="image_alt"
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="Raft passing a waterfall on the Telaga Waja river"
                className={inputClass}
              />
              <span className={hintClass}>
                Required for SEO and screen readers — describe the photo, do not repeat the title.
              </span>
            </label>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={sectionTitle}>Search engine listing</h2>
            <span className={`text-xs font-semibold ${scoreTone}`}>SEO score {score}/100</span>
          </div>

          <div className="mt-3 space-y-4">
            <label className="block">
              <span className={labelClass}>Focus keyword</span>
              <input
                value={focusKeyword}
                onChange={(event) => setFocusKeyword(event.target.value)}
                placeholder="telaga waja rafting"
                className={inputClass}
              />
              <span className={hintClass}>
                Only used for the checklist on this page; it is not saved with the tour.
              </span>
            </label>

            <label className="block">
              <span className={labelClass}>SEO title</span>
              <input
                name="seo_title"
                maxLength={60}
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                className={inputClass}
              />
              <span className="mt-1 flex items-center justify-between text-xs">
                <span className="text-river-500">Under 60 characters.</span>
                <span className={seoTitle.length > 60 ? "text-red-700" : "text-river-500"}>
                  {seoTitle.length}/60
                </span>
              </span>
            </label>

            <label className="block">
              <span className={labelClass}>Meta description</span>
              <textarea
                name="seo_description"
                rows={2}
                maxLength={160}
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                className={inputClass}
              />
              <span className="mt-1 flex items-center justify-between text-xs">
                <span className="text-river-500">Under 160 characters.</span>
                <span className={seoDescription.length > 160 ? "text-red-700" : "text-river-500"}>
                  {seoDescription.length}/160
                </span>
              </span>
            </label>
          </div>

          {/* Google preview */}
          <div className="mt-4 rounded-xl border border-river-100 bg-river-50/50 p-4">
            <p className="text-[11px] font-semibold tracking-wide text-river-500 uppercase">
              Google preview
            </p>
            <p className="mt-2 truncate text-xs text-emerald-800">
              telagawajarafting.com › tours › {effectiveSlug || "your-tour"}
            </p>
            <p className="mt-1 line-clamp-2 text-base text-[#1a0dab]">
              {seoTitle || name || "Tour title"}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-river-600">
              {seoDescription || shortDescription || "The meta description appears here."}
            </p>
          </div>

          <ul className="mt-4 space-y-1.5">
            {checks.map((check) => (
              <li key={check.label} className="flex items-start gap-2 text-xs">
                <span className={check.ok ? "text-emerald-700" : "text-river-400"}>
                  {check.ok ? "✓" : "○"}
                </span>
                <span className={check.ok ? "text-river-700" : "text-river-500"}>{check.label}</span>
              </li>
            ))}
          </ul>

          {incomplete.length > 0 ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {incomplete.length} item{incomplete.length === 1 ? "" : "s"} still to improve before
              you publish. Saving still works.
            </p>
          ) : null}
        </div>

        <div className={cardClass}>
          <h2 className={sectionTitle}>Visibility</h2>
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="published" defaultChecked={tour?.published ?? true} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="popular" defaultChecked={tour?.popular ?? false} />
              Most popular badge
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-xs text-river-700">Order</span>
              <input
                name="sort_order"
                type="number"
                defaultValue={tour?.sort_order ?? 0}
                className="w-20 rounded-lg border border-river-200 px-2 py-1 text-sm"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Highlight and itinerary */}
      <div className={tab === "content" ? "space-y-5" : "hidden"}>
        <div className={cardClass}>
          <h2 className={sectionTitle}>Highlights</h2>
          <p className={hintClass}>
            The short selling points at the top of the tour page. One per line, add and remove rows
            as you go.
          </p>
          <div className="mt-3">
            <RichTextField
              name="highlights"
              label="Highlights"
              placeholder="Two hours on the river…"
              defaultValue={tour?.highlights}
              multiple
              addLabel="Add highlight"
            />
          </div>
        </div>

        <div className={cardClass}>
          <h2 className={sectionTitle}>Included and not included</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <RichTextField
              name="includes"
              label="What's included"
              placeholder="Hotel pickup and drop-off…"
              defaultValue={tour?.includes}
              multiple
              addLabel="Add item"
            />
            <RichTextField
              name="good_to_know"
              label="Not included / good to know"
              placeholder="Bring a change of clothes…"
              defaultValue={tour?.good_to_know}
              multiple
              addLabel="Add item"
            />
          </div>
        </div>

        <div className={cardClass}>
          <ItineraryField defaultValue={tour?.itinerary} />
        </div>

        <div className={cardClass}>
          <h2 className={sectionTitle}>Practical details</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Duration</span>
              <input
                name="duration"
                defaultValue={tour?.duration}
                placeholder="About 5 hours"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Meeting point</span>
              <input
                name="meeting_point"
                defaultValue={tour?.meeting_point}
                placeholder="Our base in Rendang"
                className={inputClass}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Price and availability */}
      <div className={tab === "pricing" ? "space-y-5" : "hidden"}>
        <div className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className={sectionTitle}>Tour options</h2>
              <p className={hintClass}>
                The variants a guest can book, such as “Rafting only” or “Rafting with hotel
                transfer”. The cheapest tier of every option feeds the “from” price across the site.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openOptionWindow()}
              disabled={!tour}
              className="inline-flex items-center gap-1.5 rounded-lg border border-river-200 bg-white px-3.5 py-2 text-sm font-semibold text-river-800 transition-colors hover:bg-river-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add new option
            </button>
          </div>

          {!tour ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Save this tour once, then add its options.
            </p>
          ) : null}

          {options.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-river-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={plansTh}>Option</th>
                    <th className={plansTh}>Tiers</th>
                    <th className={plansTh}>Price from</th>
                    <th className={plansTh}>Status</th>
                    <th className={`${plansTh} w-24`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((option, index) => (
                    <tr key={`${option.name}-${index}`} className="border-t border-river-100">
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => openOptionWindow(index)}
                          className="text-left font-medium text-river-900 underline-offset-2 hover:underline"
                        >
                          {option.name || "Option"}
                        </button>
                        {option.description ? (
                          <p className="mt-0.5 text-xs text-river-500">{option.description}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-river-600">
                        {option.tiers?.length
                          ? option.tiers.map((tier) => tier.name || "Tier").join(", ")
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-river-800">
                        {option.price > 0 ? `IDR ${option.price.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {option.active === false ? (
                          <span className="text-river-500">Inactive</span>
                        ) : (
                          <span className="font-medium text-emerald-700">Active</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openOptionWindow(index)}
                            className="rounded-md border border-river-200 px-2 py-1 text-xs font-medium text-river-800 transition-colors hover:bg-river-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${option.name || "option"}`}
                            onClick={() => {
                              setOptions((current) =>
                                current.filter((_, position) => position !== index),
                              );
                              setDirty(true);
                            }}
                            className="rounded-md px-2 py-1 text-xs text-river-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-river-200 bg-river-50/60 px-4 py-8 text-xs text-river-500">
              No options yet
            </div>
          )}

          <p className="mt-3 text-xs text-river-500">
            Options are stored with the tour when you save it.
          </p>

          <input type="hidden" name="pricing_options" value={JSON.stringify(options)} readOnly />
        </div>

        <div className={cardClass}>
          <h2 className={sectionTitle}>Availability</h2>
          <p className="mt-1 text-xs text-river-600">
            Departure times, capacity per slot, operating days and blocked dates are managed in{" "}
            <a href="/admin/availability" className="font-medium text-river-900 underline">
              Admin → Availability
            </a>
            . Online and POS bookings count against the slot capacity there, so the two never
            disagree.
          </p>
          {tour ? (
            <ul className="mt-3 space-y-1 text-xs text-river-600">
              <li>Tour slug: {tour.slug}</li>
              <li>
                Current from price:{" "}
                {tour.price_adult > 0 ? `IDR ${tour.price_adult.toLocaleString("id-ID")}` : "not set"}
              </li>
            </ul>
          ) : null}
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-2xl border border-river-100 bg-white/95 p-4 shadow-sm backdrop-blur">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-river-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-river-800"
        >
          {tour ? "Save tour" : "Create tour"}
        </button>
        <span className="text-xs text-river-500">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        {score < 80 ? (
          <span className="ml-auto text-xs text-amber-800">
            SEO score {score}/100 — {incomplete.length} item{incomplete.length === 1 ? "" : "s"} to
            improve
          </span>
        ) : (
          <span className="ml-auto text-xs text-emerald-700">SEO score {score}/100</span>
        )}
      </div>
    </form>
  );
}
