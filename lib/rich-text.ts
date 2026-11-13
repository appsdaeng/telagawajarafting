/**
 * Rich text helpers for the admin tour form.
 *
 * The tour fields are stored as plain `text` / `text[]` columns, so the editor
 * only ever emits inline markup (`b`, `i`, `u`, `s`, links) plus simple lists.
 * The itinerary additionally uses a document layout (`p`, `h2`, `h3`), which is
 * opted into with `{ blocks: true }`. Everything else is stripped before the
 * value reaches the database, which keeps the stored data safe to render later
 * without trusting the browser.
 */

const INLINE_TAGS = new Set(["b", "strong", "i", "em", "u", "s", "strike", "br", "a"]);
const LIST_TAGS = new Set(["ul", "ol", "li"]);
const DOCUMENT_TAGS = new Set(["p", "div", "h2", "h3"]);

const TAG_PATTERN = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;

const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/))/i;

/**
 * Keep only formatting tags; drop every attribute except a safe href.
 *
 * `blocks` allows the document tags the itinerary editor produces (paragraphs
 * and headings). Without it the same tags are dropped but their text is kept,
 * so a single-paragraph field can never store block markup.
 */
export function sanitizeRichText(value: string, { blocks = false } = {}): string {
  if (!value) return "";

  const withoutDangerous = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|svg)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");

  let out = "";
  let lastIndex = 0;

  for (const match of withoutDangerous.matchAll(TAG_PATTERN)) {
    const index = match.index ?? 0;
    out += withoutDangerous.slice(lastIndex, index);
    lastIndex = index + match[0].length;

    const closing = match[0].startsWith("</");
    let name = match[1].toLowerCase();

    // The browser may split paragraphs with <div>; store them as <p> and
    // normalise the deprecated <strike> to <s>.
    if (name === "strike") name = "s";
    if (blocks && name === "div") name = "p";

    if (!INLINE_TAGS.has(name) && !LIST_TAGS.has(name) && !(blocks && DOCUMENT_TAGS.has(name))) {
      // Unknown tags are dropped but their text is kept.
      continue;
    }

    if (name !== "a") {
      out += closing ? `</${name}>` : `<${name}>`;
      continue;
    }

    if (closing) {
      out += "</a>";
      continue;
    }

    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(match[2] ?? "");
    const url = (href?.[1] ?? href?.[2] ?? href?.[3] ?? "").trim();

    out += SAFE_URL.test(url)
      ? `<a href="${url.replace(/"/g, "%22")}" target="_blank" rel="noopener noreferrer nofollow">`
      : "<a>";
  }

  out += withoutDangerous.slice(lastIndex);

  // Each value is a single line of the form, so newlines become spaces.
  return out.replace(/\r?\n|\r/g, " ").replace(/[ \t]{2,}/g, " ").trim();
}

/** True when the value has no visible text once the markup is removed. */
export function isRichTextEmpty(value: string): boolean {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}

const TOP_LEVEL_BLOCK = /<(p|h2|h3|ul|ol)\b[^>]*>[\s\S]*?<\/\1>/gi;

function hasVisibleText(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() !== "";
}

/**
 * Turn the itinerary document back into one step per top-level block.
 *
 * The itinerary column is a list of steps, so each paragraph becomes its own
 * entry (without the wrapping <p>, which keeps a leading time readable on the
 * public page). Headings and lists are kept whole so their markup survives.
 * Matches the editor output from `sanitizeRichText(value, { blocks: true })`.
 */
export function splitRichTextBlocks(value: string): string[] {
  if (!value) return [];

  const blocks: string[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(TOP_LEVEL_BLOCK)) {
    const index = match.index ?? 0;
    const between = value.slice(lastIndex, index).trim();

    if (hasVisibleText(between)) blocks.push(between);

    lastIndex = index + match[0].length;

    const tag = match[1].toLowerCase();
    const whole = match[0].trim();

    if (tag === "p") {
      const inner = whole.replace(/^<p\b[^>]*>/i, "").replace(/<\/p>$/i, "").trim();

      if (hasVisibleText(inner)) blocks.push(inner);
    } else if (hasVisibleText(whole)) {
      blocks.push(whole);
    }
  }

  const tail = value.slice(lastIndex).trim();

  if (hasVisibleText(tail)) blocks.push(tail);

  return blocks;
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ItineraryStepInput = {
  time?: unknown;
  title?: unknown;
  description?: unknown;
};

const DESCRIPTION_BLOCK = /^<(?:ul|ol|p|h2|h3|div|blockquote)\b/i;

/**
 * One stored itinerary step: the time, the title and the description, in the
 * single HTML string the `itinerary` column holds.
 *
 * The description keeps its own blocks (bullet and numbered lists, paragraphs),
 * which is why steps are posted as JSON and assembled here instead of being
 * split back out of one document: splitting on top-level blocks would turn a
 * bullet list into separate steps.
 */
export function itineraryStepToHtml(step: ItineraryStepInput): string {
  const time = typeof step.time === "string" ? step.time.trim() : "";
  const title = typeof step.title === "string" ? step.title.trim() : "";
  const description = sanitizeRichText(
    typeof step.description === "string" ? step.description.trim() : "",
    { blocks: true },
  );

  const head = [escapeHtmlText(time), title ? `<strong>${escapeHtmlText(title)}</strong>` : ""]
    .filter(Boolean)
    .join(" ");

  if (!head) {
    return description;
  }

  // A list or paragraph already starts on its own line; a plain sentence needs
  // the line break that keeps it under the title.
  return description ? `${head}${DESCRIPTION_BLOCK.test(description) ? "" : "<br>"}${description}` : head;
}
