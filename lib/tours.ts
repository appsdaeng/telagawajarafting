/**
 * Tour catalogue for the public site.
 *
 * PLACEHOLDER DATA — the prices below are examples, not the operator's real
 * rates. In Phase 2 this file is replaced by the `Tour` table in Postgres so
 * an admin can edit tours from the portal. Until then, edit them here.
 */

export type Tour = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** Whole rupiah, no decimals. */
  priceAdult: number;
  priceChild: number;
  duration: string;
  meetingPoint: string;
  includes: string[];
  highlights: string[];
};

export const tours: Tour[] = [
  {
    slug: "telaga-waja-rafting",
    name: "Telaga Waja Rafting",
    tagline: "Our signature run — 14 km of Class II–III rapids",
    description:
      "The classic Telaga Waja descent. A long, steady run through jungle, rice terraces and river-carved rock, finishing at the dramatic drop below the bridge. Suitable for beginners and families, with an experienced guide in every raft.",
    priceAdult: 450_000,
    priceChild: 350_000,
    duration: "2.5–3 hours on the water",
    meetingPoint: "Telaga Waja base camp, Rendang, Karangasem",
    includes: [
      "Professional river guide",
      "All safety equipment and helmet",
      "Buffet lunch after the run",
      "Hot shower and changing rooms",
      "Lockers for valuables",
      "Return transport from Ubud, Seminyak or Kuta",
    ],
    highlights: [
      "14 km of continuous Class II–III rapids",
      "Waterfalls and jungle canyon scenery",
      "The 4-metre drop at the finish",
      "Suitable for ages 7 and up",
    ],
  },
  {
    slug: "telaga-waja-sunrise",
    name: "Telaga Waja Sunrise Run",
    tagline: "First raft on the river, before the heat and the crowds",
    description:
      "An early departure that puts you on the water as the valley wakes up. Mist on the river, no other rafts in front of you, and the same full descent — back at base camp before midday.",
    priceAdult: 550_000,
    priceChild: 450_000,
    duration: "2.5–3 hours on the water",
    meetingPoint: "Telaga Waja base camp, Rendang, Karangasem",
    includes: [
      "Early pickup from your hotel",
      "Professional river guide",
      "All safety equipment and helmet",
      "Breakfast at base camp",
      "Buffet lunch after the run",
      "Hot shower and changing rooms",
    ],
    highlights: [
      "Departure before 07:00",
      "Quiet river — first group on the water",
      "Same 14 km descent as the signature run",
      "Best light for photography",
    ],
  },
  {
    slug: "telaga-waja-plus-ubud",
    name: "Rafting + Ubud Tour",
    tagline: "Raft in the morning, rice terraces in the afternoon",
    description:
      "The full day: the signature Telaga Waja descent in the morning, then a guided afternoon through Ubud — Tegalalang rice terraces, a coffee plantation and the monkey forest — with a private car and driver.",
    priceAdult: 850_000,
    priceChild: 700_000,
    duration: "Full day, approx. 9 hours",
    meetingPoint: "Hotel pickup in Ubud, Seminyak, Kuta or Sanur",
    includes: [
      "Private air-conditioned car and driver",
      "Professional river guide",
      "All safety equipment and helmet",
      "Buffet lunch after the run",
      "Ubud afternoon tour with stops",
      "Entrance fees for listed stops",
    ],
    highlights: [
      "Rafting plus a half-day Ubud tour",
      "Tegalalang rice terraces",
      "Coffee plantation tasting",
      "Private car — your own pace",
    ],
  },
];

export function getTour(slug: string): Tour | undefined {
  return tours.find((tour) => tour.slug === slug);
}

export function formatRupiah(amount: number): string {
  return `IDR ${amount.toLocaleString("id-ID")}`;
}

/**
 * Turn NEXT_PUBLIC_SITE_URL into something `new URL()` accepts.
 *
 * Environment variables are typed by humans: a bare domain such as
 * `www.example.com` has no scheme, and `new URL()` throws on it during the
 * production build (it would otherwise crash every page through metadataBase).
 * Accept a missing scheme, a trailing slash or a stray path, and fall back to
 * localhost rather than failing the build.
 */
function normalizeSiteUrl(raw: string | undefined): string {
  const value = raw?.trim();

  if (!value) {
    return "http://localhost:3000";
  }

  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return new URL(withScheme).origin;
  } catch {
    return "http://localhost:3000";
  }
}

/**
 * Reduce a human-typed phone number to the digits-only international form wa.me
 * expects. `+62 812-3456-7890` and the local `0812-3456-7890` both become
 * `6281234567890`; anything too short falls back to the placeholder.
 */
function normalizeWhatsAppNumber(raw: string | undefined): string {
  const digits = raw?.replace(/\D/g, "") ?? "";
  const international = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;

  return international.length >= 8 ? international : "6281234567890";
}

/**
 * Public, non-secret configuration. Both values are placeholders until the
 * real number and domain are set in Vercel → Settings → Environment Variables.
 */
export const siteConfig = {
  name: "Telaga Waja Rafting",
  location: "Rendang, Karangasem, Bali",
  whatsappNumber: normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
};

/** Build a wa.me deep link with a pre-filled enquiry message. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
