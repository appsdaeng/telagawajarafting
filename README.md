# Telaga Waja Rafting — Website, Admin & Staff Portal

Public website and internal point-of-sale for Telaga Waja Rafting, Bali.

**Status: public marketing site built and search-optimised. The admin portal, POS,
database and online payment are not built yet.** The site takes bookings the way the
business takes them today — by WhatsApp — and prices and confirms them there.

- [`docs/BRIEF.md`](docs/BRIEF.md) — scope, stack, roles, security, commercials
- [`docs/DELIVERY-CHECKLIST.md`](docs/DELIVERY-CHECKLIST.md) — how the finished work is reviewed
- [`docs/WHATSAPP.md`](docs/WHATSAPP.md) — short version of the brief

## What exists

| Page | URL | Notes |
|------|-----|-------|
| Home | `/` | Hero, booking widget, trust bar, tours, inclusions, easy payment, day timeline, safety, FAQ, CTA |
| Tours | `/tours` | Full comparison with IDR pricing |
| Tour detail | `/tours/[slug]` | 300+ words each, own title/description/canonical, TouristTrip markup |
| FAQ | `/faq` | Booking, payment, cancellation, what to bring — with FAQPage markup |
| Contact | `/contact` | Location, hours, pickup areas, WhatsApp booking |
| 404 | any unknown URL | Custom page with routes back into the site |
| Sitemap | `/sitemap.xml` | Generated, includes every tour |
| robots.txt | `/robots.txt` | Blocks portal paths, points at the sitemap |

## Booking, as it works today

The widget on the home page collects tour, date, adults and children, prices the party
and hands the request to WhatsApp with everything pre-filled. It shows the configured
departure times from `lib/availability.ts`.

**It does not reserve seats, and it must not pretend to.** Each departure is confirmed
by a human. Moving to real online booking needs, in this order:

1. **Postgres** (Neon/Supabase) with `tours`, `departures`, `bookings`, `payments`,
   `users` tables — availability moves from `lib/availability.ts` into a server-side
   check that decrements capacity, so a full slot cannot be sold twice.
2. **A payment gateway** — Midtrans or Xendit for Indonesian cards, QRIS, e-wallets and
   bank transfer (Stripe only if you also want to accept foreign cards directly). Keys
   and webhook secrets go in Vercel, never in this repo.
3. **Transactional email** for confirmations and the day-before reminder.
4. **Admin + staff portal**, so walk-in POS sales and online bookings draw on the same
   availability.

None of that is scaffolding here: it is additive work, and the widget is the seam.

### Payment

`paymentMethods` in `lib/content.ts` is the single source for accepted methods: Visa and
Mastercard, QRIS, e-wallet, PayPal, Google Pay, Apple Pay, and cash at base camp. It
feeds the "Easy payment" section on the home page and the payment FAQ, so adding or
removing a method is a one-line change.

Cash at base camp is flagged `venueOnly`: it only works when the guest drives to the
starting point. Pickup bookings are paid before the driver leaves, which is why the
section and the FAQ both state that rule rather than promising "pay on the day" to
everyone.

No card details are collected by this site and it runs no checkout — methods are
arranged with staff on WhatsApp. When the gateway from step 2 is connected, this list
becomes the checkout's method picker.

## Media (photos and video)

The site is designed to look finished with no photos, and to get better the moment they
arrive. Drop files at these exact paths and they appear; if a file is missing the
component falls back to a gradient panel.

```
public/media/hero.jpg (or hero.jpeg)        hero still (also used as the video poster)
public/media/hero.mp4                      optional looping hero video, muted, no audio
public/media/tours/telaga-waja-rafting.jpg
public/media/tours/telaga-waja-sunrise.jpg
public/media/tours/telaga-waja-plus-ubud.jpg
public/media/gallery/<anything>.jpg        then add entries to `gallery` in lib/content.ts
```

Alt text for tour images lives in `lib/tours.ts`; alt text for gallery images is part of
each `gallery` entry and is required. Use compressed JPEG/WebP around 1600 px wide —
`next/image` handles resizing and format negotiation, but not badly exported originals.

## SEO

- One H1 per page, unique title (under 60 characters) and description, canonical URL on
  every page.
- Structured data: `LocalBusiness` + `TouristAttraction` on the home page, `TouristTrip`
  with a priced `Offer` per tour, `FAQPage` on `/faq`, `BreadcrumbList` on inner pages.
- **No `AggregateRating` or `Review` markup.** `siteConfig.reviews` is `null` and
  `reviews` in `lib/content.ts` is empty, so the rating badge and reviews section are not
  rendered at all. Fill those in from the real Google Business Profile and they appear —
  invented review markup is a manual-action risk and a lie to guests.
- Generated `sitemap.xml`, `robots.txt`, custom 404, internal links between home, tours,
  tour pages, FAQ and contact.
- `NEXT_PUBLIC_SITE_URL` drives canonicals, Open Graph URLs, the sitemap and robots. A
  bare domain is accepted (`www.example.com`) and normalised to `https://`.

Before launch, on the live domain:

1. Google Search Console: add the property, submit `/sitemap.xml`.
2. Rich Results Test on `/` and a tour page — expect LocalBusiness/TouristTrip, no errors.
3. PageSpeed Insights on mobile. The pages are static and ship no framework JavaScript
   beyond the widget and analytics; most remaining weight will be your hero image.
4. Create the Google Business Profile with the same name, address and phone as
   `siteConfig`, and ask every guest for a review.
5. Confirm `www` and non-www resolve to one version (Vercel → Domains → redirect).

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # must pass before merging
npm run lint
```

Node 20 or newer. Copy `.env.example` to `.env.local` — the public site runs with no
environment file at all, because every public value has a fallback.

## Placeholders to replace before launch

- **Prices and tour copy** — `lib/tours.ts`. The rates are examples, not the operator's.
- **WhatsApp number** — `NEXT_PUBLIC_WHATSAPP_NUMBER` in Vercel. Any format works:
  `+62 812-3456-7890`, `0812…` and `62812…` are all normalised to digits.
- **Address, hours, pickup areas** — `siteConfig` in `lib/tours.ts`. This feeds both the
  contact page and the schema markup, so a wrong address is wrong in Google too.
- **Departure times** — `lib/availability.ts`.
- **Payment methods** — `paymentMethods` in `lib/content.ts`.
- **Reviews** — `reviews` in `lib/content.ts` and `siteConfig.reviews`.

## Agreed stack

Next.js (App Router) + TypeScript on Vercel, Postgres (Neon or Supabase) via Prisma or
Drizzle, Auth.js or Supabase Auth with a `role` field, hosted image storage (Vercel Blob,
Cloudinary or Supabase Storage — Vercel's filesystem is read-only), Tailwind.

Analytics: `@vercel/analytics`, loaded in the root layout, with custom events
`availability_checked` and `whatsapp_handoff` from the booking widget.

## Deploying to Vercel

Import the repo with the **Next.js** preset, root directory at the repo root, build and
output settings on their defaults, Node 20 or 22. Environment variables live in Vercel →
Settings → Environment Variables, never in this repository. `NEXT_PUBLIC_*` values are
inlined at build time, so changing them needs a redeploy.

## Branch model

`main` is production and auto-deploys. `develop` is integration; preview deployments are
for review. Nothing merges to `main` without a passing preview build.
