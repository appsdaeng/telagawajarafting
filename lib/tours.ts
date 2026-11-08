/**
 * Tour catalogue for the public site.
 *
 * PLACEHOLDER DATA — the prices and descriptions below are examples, not the
 * operator's real rates. In Phase 2 this file is replaced by the `Tour` table in
 * Postgres so an admin can edit tours from the portal. Until then, edit them here.
 *
 * Images are resolved at build time: drop a file at the `image.src` path under
 * `public/` and it appears on the site; if the file is missing the card falls
 * back to a gradient panel instead of a broken image.
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
  /** "Most popular" badge. Positioned here until the admin portal can set it. */
  popular?: boolean;
  image: { src: string; alt: string };
  /** Long-form copy for the tour page. Three or more paragraphs of original text. */
  story: string[];
  goodToKnow: string[];
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
    popular: true,
    image: {
      src: "/media/tours/telaga-waja-rafting.jpg",
      alt: "Guests paddling a raft through rapids on the Telaga Waja river in Bali",
    },
    story: [
      "The Telaga Waja is the longest rafting run in Bali that most operators will take a beginner on. You put in near Rendang, high in the Karangasem hills, and spend the next two and a half hours working your way down a river that has cut a narrow canyon through soft volcanic rock. The water is clear, cold and steady — fed by springs further up the mountain rather than by rain, which is why the run stays open through the wet season when other rivers on the island turn brown and get closed.",
      "The first stretch is gentle enough to learn the rhythm: forward paddle, hold, lean. Your guide calls the strokes and steers from the back, and by the second set of rapids the crew is usually working together without being told. From there the river picks up — a series of Class II and Class III drops, a few tight corners against the canyon wall, and long flat sections where you can look up at the jungle instead of at the water. Expect to be wet within the first ten minutes.",
      "The finish is the part people remember. The river narrows, the guide lines the raft up, and you drop roughly four metres down a natural chute below the bridge, into a calm pool where the camera crew is waiting. From the take-out it is a short walk to base camp, a hot shower, and a buffet lunch on the terrace overlooking the valley. Most guests are back at their hotel by mid-afternoon.",
      "This is the tour to pick if you want one full, satisfying descent rather than a short sampler. Families with children from about seven years old do it comfortably, and it is a good first rafting trip for anyone who has never held a paddle — no previous experience is needed, and non-swimmers ride with a guide who does the steering.",
    ],
    goodToKnow: [
      "Ages 7 and up; children under 12 ride at the child rate",
      "No previous rafting experience needed; non-swimmers are welcome",
      "Bring a change of clothes and a dry bag for phones",
      "Not recommended during pregnancy or with serious back problems",
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
    image: {
      src: "/media/tours/telaga-waja-sunrise.jpg",
      alt: "Morning mist over the Telaga Waja river valley in Karangasem, Bali",
    },
    story: [
      "This is the same river, the same fourteen kilometres and the same guides as the signature run — the difference is the hour. You leave your hotel before dawn, reach base camp as the light comes over the ridge, and are usually the first raft on the water. For the first half hour the valley is quiet enough that you can hear birds over the sound of the river, and the mist sits in the canyon until the sun climbs above it.",
      "The early start also solves the two things guests complain about most on afternoon departures: heat and other rafts. By ten in the morning the canyon is still cool and shaded, and because you are ahead of the day's groups there is nobody queuing at the drops or crowding the take-out. Photographers get the better light, too — low sun on wet rock rather than flat midday glare.",
      "Breakfast is served at base camp before you launch, and lunch is waiting when you come off the water, so the whole trip is finished around midday. That leaves the rest of the day free, which makes this a good choice if you are staying in Ubud and want the afternoon for the rice terraces, or if you are heading to the airport or the islands later that day.",
      "Because pickups start around 5:30 in the morning, this run suits guests who are already adjusted to Bali time. If you have just landed the night before, book the signature run instead and give yourself the extra sleep.",
      "Practically, the early start asks a little more of you: set two alarms, put your bag out the night before, and wear the clothes you plan to get wet in rather than changing at base camp. The driver waits, but the schedule does not — a group that arrives late leaves late, and the whole point of this departure is being ahead of the crowd. Guests who make the effort consistently rate it as the better of the two runs, and the photographs are the reason. Morning light on the canyon is soft and even, where midday sun blows out the highlights on the water.",
    ],
    goodToKnow: [
      "Hotel pickup from roughly 05:30, depending on where you stay",
      "Breakfast at base camp before departure",
      "Same rapids and distance as the signature run",
      "Finished by early afternoon — good for a transfer day",
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
    image: {
      src: "/media/tours/telaga-waja-plus-ubud.jpg",
      alt: "Terraced rice fields near Ubud, Bali, visited after the rafting trip",
    },
    story: [
      "Some guests want the river and nothing else; others have one free day in Bali and want to see as much of it as they reasonably can. This tour is for the second group. The morning is the full Telaga Waja descent, exactly as on the signature run — same rapids, same guides, same lunch at base camp — and the afternoon is a private car through Ubud with a driver who knows when to skip a stop because it is raining or packed.",
      "The usual afternoon route runs from base camp up to Tegalalang for the rice terraces, then to a working coffee plantation for a tasting of the island's arabica and the famous luwak coffee, and on to the monkey forest in central Ubud if there is still time and appetite for it. None of it is compulsory: tell the driver what you care about and the route bends around it. Some guests skip the monkeys entirely and spend the time in the Ubud market instead.",
      "Because the car is private rather than a shared shuttle, the day moves at your pace. There is no waiting for other groups to finish lunch and no fixed thirty-minute stop at a shop you did not ask to visit. Entrance fees for the listed stops are included in the price, and the driver stays with you from pickup to drop-off.",
      "It makes for a long day — around nine hours door to door from the southern beach areas — so it suits guests with at least a few nights in Bali rather than a layover. If you are staying in Ubud itself, the pickup is short and the day finishes earlier.",
      "One thing worth knowing before you book: the afternoon is a tour, not a shopping trip. The driver takes you to the stops, explains them, and waits, but there is no guided walk through the terraces and no pressure to buy anything at the plantation. Guests who want a slower, more detailed afternoon in Ubud usually do better with a dedicated Ubud day tour and the rafting on a separate morning. Guests who want one efficient day that covers both, without organising two bookings and two pickups, are exactly who this was built for.",
    ],
    goodToKnow: [
      "Around nine hours door to door from Seminyak, Kuta or Sanur",
      "Private car and driver, not a shared shuttle",
      "Entrance fees for the listed stops included",
      "Route can be adjusted on the day",
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
 * Public, non-secret configuration. These are placeholders until the real
 * details are set in Vercel → Settings → Environment Variables / lib/site.ts.
 *
 * NOTHING here may be invented: the address, hours and review figures are the
 * operator's real-world facts and are left empty or explicitly marked until
 * they are supplied.
 */
export const siteConfig = {
  name: "Telaga Waja Rafting",
  location: "Rendang, Karangasem, Bali",
  /** Street address is a placeholder — replaced from site settings before launch. */
  streetAddress: "Jl. Raya Rendang, Rendang",
  addressLocality: "Karangasem",
  addressRegion: "Bali",
  postalCode: "80863",
  country: "ID",
  /** Opening hours in schema.org format (Mo–Su, 07:00–17:00). */
  openingHours: "Mo-Su 07:00-17:00",
  hoursLabel: "Every day, 07:00 – 17:00",
  pickupAreas: "Ubud, Seminyak, Kuta, Sanur and Canggu. Other areas on request.",
  whatsappNumber: normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  /**
   * Real review data only. Left null so the rating badge and Review schema are
   * not rendered with invented numbers — Google penalises fake review markup
   * and it would be a lie to guests. Fill in from the Google Business Profile.
   */
  reviews: null as null | { rating: number; count: number; url: string },
  /** Set once a Google Business Profile exists; used for the "reviews" links. */
  googleBusinessUrl: null as string | null,
};

/** Build a wa.me deep link with a pre-filled enquiry message. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
