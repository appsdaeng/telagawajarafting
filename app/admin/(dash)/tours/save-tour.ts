"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { databaseConfigured, sql } from "@/lib/db";
import type { TourOption, TourOptionField, TourTier } from "@/lib/db-types";
import { sanitizeRichText, splitRichTextBlocks } from "@/lib/rich-text";
import { saveTourAction } from "../actions";

/**
 * The tour form posts rich text as HTML. Clean the four rich text fields here
 * before handing the form to `saveTourAction`, so the database only ever holds
 * the inline tags the editor can produce.
 *
 * The gallery is written here too rather than in `saveTourAction`: the action
 * owns the tour columns, while this wrapper has the whole form including the
 * photo list, and `saveTourAction` ends in redirect() (which throws), so the
 * write happens in the `finally` block.
 */

/**
 * `redirect()` and `notFound()` work by throwing, so a catch block around a
 * save must let their error through untouched: swallowing it would replace the
 * navigation with "the save failed".
 */
function isNavigationError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/** The real reason a save failed, including the database's own detail. */
function describeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error).slice(0, 400);
  }

  const extra = error as Error & {
    code?: string;
    detail?: string;
    constraint?: string;
    column?: string;
  };

  return [
    error.message || "Unknown error",
    extra.code ? `code ${extra.code}` : "",
    extra.constraint ? `constraint ${extra.constraint}` : "",
    extra.column ? `column ${extra.column}` : "",
    extra.detail ?? "",
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 400);
}

const BLOCK_FIELDS = new Set(["itinerary"]);
const PARAGRAPH_FIELDS = new Set(["description"]);
const LINE_FIELDS = new Set(["story", "includes", "highlights"]);

function clean(key: string, value: string): string {
  if (BLOCK_FIELDS.has(key)) {
    return sanitizeRichText(value, { blocks: true });
  }

  if (PARAGRAPH_FIELDS.has(key)) {
    return sanitizeRichText(value);
  }

  if (LINE_FIELDS.has(key)) {
    return value
      .split("\n")
      .map((line) => sanitizeRichText(line))
      .filter(Boolean)
      .join("\n");
  }

  return value;
}

/** Mirrors the slug rule in `saveTourAction`, for the just-created tour. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function readGallery(form: FormData): string[] {
  try {
    const parsed: unknown = JSON.parse(String(form.get("gallery_urls") ?? "[]"));

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 30);
  } catch {
    return [];
  }
}

/** One itinerary step per top-level block (paragraph, heading or list). */
function readItinerary(form: FormData): string[] {
  return splitRichTextBlocks(String(form.get("itinerary") ?? "")).slice(0, 40);
}

function plainText(value: unknown, max = 300): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** The price bands the option window posts, oldest storage keeps `price`/`field`. */
function readTiers(value: unknown): TourTier[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      name: plainText(item.name, 60),
      price: Math.max(0, Math.trunc(Number(item.price) || 0)),
      min: Math.max(0, Math.trunc(Number(item.min) || 0)),
      max: Math.max(0, Math.trunc(Number(item.max) || 0)),
      priceType: plainText(item.priceType, 40) || "Per person",
    }))
    .filter((tier) => tier.name || tier.price)
    .slice(0, 12);
}

/** Extra guest questions for the option. */
function readOptionFields(value: unknown): TourOptionField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      label: plainText(item.label, 80),
      type: plainText(item.type, 20) || "Text",
      required: item.required === true || item.required === "true",
    }))
    .filter((field) => field.label)
    .slice(0, 12);
}

/** The extra tour/pricing options, posted as JSON by the option editor. */
function readOptions(form: FormData): TourOption[] {
  try {
    const parsed: unknown = JSON.parse(String(form.get("pricing_options") ?? "[]"));

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object",
      )
      .map((item) => {
        const tiers = readTiers(item.tiers);
        const fields = readOptionFields(item.fields);
        const cheapest = tiers.reduce(
          (min, tier) => (tier.price > 0 && tier.price < min ? tier.price : min),
          Number.POSITIVE_INFINITY,
        );

        return {
          name: plainText(item.name, 80),
          description: plainText(item.description, 500),
          price:
            Math.max(0, Math.trunc(Number(item.price) || 0)) ||
            (Number.isFinite(cheapest) ? cheapest : 0),
          field: plainText(item.field, 80) || tiers[0]?.priceType || "",
          tiers,
          fields,
          active: item.active !== false,
        };
      })
      .filter(
        (option) =>
          option.name ||
          option.description ||
          option.price ||
          option.field ||
          option.tiers?.length ||
          option.fields?.length,
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}

/**
 * The gallery and itinerary live outside `saveTourAction`, so a failure here
 * used to be logged and forgotten: the form said "saved" while the steps were
 * gone. Return the message so the caller can show it.
 */
async function saveGallery(form: FormData): Promise<string | null> {
  const gallery = readGallery(form);
  const itinerary = readItinerary(form);
  const id = String(form.get("id") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? "").trim() || String(form.get("name") ?? ""));

  if (!databaseConfigured || (!id && !slug)) {
    return null;
  }

  try {
    if (id) {
      const rows = await sql`
        update public.tours
        set gallery_urls = ${gallery}, itinerary = ${itinerary}, updated_at = now()
        where id = ${id}
        returning id
      `;

      if (rows.length === 0) {
        return `nothing matched id ${id}`;
      }
    } else {
      await sql`
        update public.tours
        set gallery_urls = ${gallery}, itinerary = ${itinerary}, updated_at = now()
        where slug = ${slug}
      `;
    }
  } catch (error) {
    console.error("[tours] could not save the gallery or itinerary", error);
    return describeError(error);
  }

  return null;
}

/**
 * Pricing now comes from the tour options, so the form no longer posts
 * `price_adult` / `price_child`. The rest of the app still reads those two
 * columns: keep the saved values for an existing tour, and fall back to the
 * cheapest option for a new one instead of overwriting them with zero.
 */
async function applyFallbackPrices(form: FormData): Promise<void> {
  if (form.has("price_adult") || form.has("price_child")) {
    return;
  }

  const id = String(form.get("id") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? "").trim() || String(form.get("name") ?? ""));
  let adult = 0;
  let child = 0;

  if (databaseConfigured) {
    try {
      const rows: { price_adult: number; price_child: number }[] = id
        ? await sql`select price_adult, price_child from public.tours where id = ${id} limit 1`
        : await sql`select price_adult, price_child from public.tours where slug = ${slug} limit 1`;

      if (rows[0]) {
        adult = Number(rows[0].price_adult) || 0;
        child = Number(rows[0].price_child) || 0;
      }
    } catch (error) {
      console.error("[tours] could not read the current prices", error);
    }
  }

  if (adult === 0) {
    const cheapest = readOptions(form).reduce(
      (min, option) => (option.price > 0 && option.price < min ? option.price : min),
      Number.POSITIVE_INFINITY,
    );

    if (Number.isFinite(cheapest)) {
      adult = cheapest;
      child = cheapest;
    }
  }

  form.set("price_adult", String(adult));
  form.set("price_child", String(child));
}

async function saveOptions(form: FormData): Promise<string | null> {
  const options = readOptions(form);
  const id = String(form.get("id") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? "").trim() || String(form.get("name") ?? ""));

  if (!databaseConfigured || (!id && !slug)) {
    return null;
  }

  try {
    const json = JSON.stringify(options);

    if (id) {
      await sql`
        update public.tours set pricing_options = ${json}::jsonb, updated_at = now()
        where id = ${id}
      `;
    } else {
      await sql`
        update public.tours set pricing_options = ${json}::jsonb, updated_at = now()
        where slug = ${slug}
      `;
    }
  } catch (error) {
    console.error("[tours] could not save the pricing options", error);
    return describeError(error);
  }

  return null;
}

export async function saveTourWithRichTextAction(form: FormData): Promise<void> {
  const cleaned = new FormData();

  for (const [key, value] of form.entries()) {
    cleaned.append(key, typeof value === "string" ? clean(key, value) : value);
  }

  const id = String(form.get("id") ?? "").trim();
  const path = id ? `/admin/tours/${id}` : "/admin/tours/new";
  let failure: string | null = null;

  try {
    await applyFallbackPrices(cleaned);
    await saveTourAction(cleaned);
  } catch (error) {
    if (isNavigationError(error)) {
      throw error;
    }

    console.error("[tours] could not save the tour", error);
    failure = `Could not save the tour: ${describeError(error)}`;
  } finally {
    const galleryError = await saveGallery(cleaned);
    const optionsError = await saveOptions(cleaned);

    if (galleryError) {
      console.error("[tours] gallery/itinerary were not saved", galleryError);
      failure = failure ?? `Photos and itinerary were not saved: ${galleryError}`;
    }

    if (optionsError) {
      console.error("[tours] pricing options were not saved", optionsError);
      failure = failure ?? `Pricing options were not saved: ${optionsError}`;
    }

    // `saveTourAction` ends in redirect(), which throws, so refresh the cached
    // public tour pages here. Revalidation must never throw: if it did, it
    // would replace the redirect and the form would report a failed save.
    if (!failure) {
      try {
        revalidateTag("tours", "max");
        revalidatePath("/tours", "layout");
      } catch (error) {
        console.error("[tours] could not revalidate after save", error);
      }
    }
  }

  // Report the real reason instead of a blank crash: the edit page shows
  // `?error=` in a red banner and the operator can fix and retry.
  if (failure) {
    redirect(`${path}?error=${encodeURIComponent(failure)}`);
  }
}
