"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { databaseConfigured, sql } from "@/lib/db";
import { sanitizeRichText } from "@/lib/rich-text";
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

const PARAGRAPH_FIELDS = new Set(["description", "itinerary"]);
const LINE_FIELDS = new Set(["story", "includes", "highlights"]);

function clean(key: string, value: string): string {
  if (PARAGRAPH_FIELDS.has(key)) {
    return sanitizeRichText(value);
  }

  if (LINE_FIELDS.has(key)) {
    return value
      .split("\n")
      .map(sanitizeRichText)
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

function readLines(form: FormData, field: string): string[] {
  return String(form.get(field) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 40);
}

async function saveGallery(form: FormData): Promise<void> {
  const gallery = readGallery(form);
  const itinerary = readLines(form, "itinerary");
  const id = String(form.get("id") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? "").trim() || String(form.get("name") ?? ""));

  if (!databaseConfigured || (!id && !slug)) {
    return;
  }

  try {
    if (id) {
      await sql`
        update public.tours
        set gallery_urls = ${gallery}, itinerary = ${itinerary}, updated_at = now()
        where id = ${id}
      `;
    } else {
      await sql`
        update public.tours
        set gallery_urls = ${gallery}, itinerary = ${itinerary}, updated_at = now()
        where slug = ${slug}
      `;
    }
  } catch (error) {
    console.error("[tours] could not save the gallery or itinerary", error);
  }
}

export async function saveTourWithRichTextAction(form: FormData): Promise<void> {
  const cleaned = new FormData();

  for (const [key, value] of form.entries()) {
    cleaned.append(key, typeof value === "string" ? clean(key, value) : value);
  }

  try {
    await saveTourAction(cleaned);
  } finally {
    await saveGallery(cleaned);
    // `saveTourAction` ends in redirect(), which throws, so refresh the cached
    // public tour pages here. Revalidation must never throw: if it did, it
    // would replace the redirect and the form would report a failed save.
    try {
      revalidateTag("tours", "max");
      revalidatePath("/tours", "layout");
    } catch (error) {
      console.error("[tours] could not revalidate after save", error);
    }
  }
}
