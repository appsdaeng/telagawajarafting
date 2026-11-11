"use server";

import { sanitizeRichText } from "@/lib/rich-text";
import { saveTourAction } from "../actions";

/**
 * The tour form posts rich text as HTML. Clean the four rich text fields here
 * before handing the form to `saveTourAction`, so the database only ever holds
 * the inline tags the editor can produce.
 */

const PARAGRAPH_FIELDS = new Set(["description"]);
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

export async function saveTourWithRichTextAction(form: FormData): Promise<void> {
  const cleaned = new FormData();

  for (const [key, value] of form.entries()) {
    cleaned.append(key, typeof value === "string" ? clean(key, value) : value);
  }

  await saveTourAction(cleaned);
}
