import type { TourOption, TourTier } from "./db-types";

/** A tier's guest range, with the numbers coerced to sane integers. */
function tierRange(tier: TourTier): { min: number; max: number; price: number } {
  const price = Math.max(0, Math.trunc(Number(tier.price) || 0));
  const min = Math.max(1, Math.trunc(Number(tier.min) || 0));
  const max = Math.max(min, Math.trunc(Number(tier.max) || 0));

  return { min, max, price };
}

/**
 * The tier whose Min–Max covers the party, e.g. 3 guests in a 2–3 tier.
 *
 * Returns null when no tier covers the party, so a caller can say the option is
 * not available for that many guests instead of quoting a price that does not
 * apply. Tiers with no price are ignored: they are rows the operator is still
 * filling in.
 */
export function tierForParty(
  option: { tiers?: TourTier[] },
  party: number,
): TourTier | null {
  const count = Math.max(1, Math.trunc(party) || 1);

  return (
    (option.tiers ?? []).find((tier) => {
      if (!tier) {
        return false;
      }

      const range = tierRange(tier);
      return range.price > 0 && count >= range.min && count <= range.max;
    }) ?? null
  );
}

/**
 * The per-person price for the party: the tier that covers it, or the option's
 * base price when it has no tiers (or none covers the party).
 */
export function priceForParty(
  option: { tiers?: TourTier[]; price?: number },
  party: number,
): number {
  const tier = tierForParty(option, party);

  if (tier) {
    return tierRange(tier).price;
  }

  return Math.max(0, Math.trunc(Number(option.price) || 0));
}

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
