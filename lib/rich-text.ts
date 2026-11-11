/**
 * Rich text helpers for the admin tour form.
 *
 * The tour fields are stored as plain `text` / `text[]` columns, so the editor
 * only ever emits inline markup (`b`, `i`, `u`, links). Everything else is
 * stripped before the value reaches the database, which keeps the stored data
 * safe to render later without trusting the browser.
 */

const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "br", "a", "ul", "ol", "li"]);

const TAG_PATTERN = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;

const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/))/i;

/** Keep only inline formatting tags; drop every attribute except a safe href. */
export function sanitizeRichText(value: string): string {
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
    const name = match[1].toLowerCase();

    if (!ALLOWED_TAGS.has(name)) {
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
