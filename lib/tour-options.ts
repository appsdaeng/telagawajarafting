import type { TourOption } from "./db-types";

/**
 * Read `tours.pricing_options` defensively.
 *
 * The column is `jsonb`, so it can legally hold anything: an array (what the
 * form writes), `null`, an object, or a JSON *string* left behind by an older
 * save or a manual edit. Calling `.map()` on those values threw
 * "`.map` is not a function" and took the whole tour editor down, so every
 * reader goes through here and always gets a list, with `tiers` and `fields`
 * normalised to arrays too.
 */
export function asTourOptions(value: unknown): TourOption[] {
  let parsed = value;

  // jsonb holding a string, possibly encoded twice.
  for (let attempt = 0; attempt < 3 && typeof parsed === "string"; attempt += 1) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    )
    .map((item) => {
      const option = item as unknown as TourOption;

      return {
        ...option,
        tiers: Array.isArray(item.tiers) ? option.tiers : [],
        fields: Array.isArray(item.fields) ? option.fields : [],
      };
    });
}
