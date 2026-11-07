# Telaga Waja Rafting — Website, Admin & Staff Portal

Public website and internal point-of-sale for Telaga Waja Rafting, Bali.

**Status: public site built, portal not started.** The customer-facing pages (home, tours,
tour detail, contact) are implemented and build cleanly on Next.js 16. The login area, POS,
gallery and admin portal from the brief are **not built yet**.

- [`docs/BRIEF.md`](docs/BRIEF.md) — the full brief: scope, stack, roles, security, commercials
- [`docs/DELIVERY-CHECKLIST.md`](docs/DELIVERY-CHECKLIST.md) — how the finished work is reviewed
- [`docs/WHATSAPP.md`](docs/WHATSAPP.md) — short version of the brief for initial contact

## What the project is

A customer-facing site (Home, Tours, Tour detail, Contact) with a WhatsApp "Book now"
enquiry button, plus a login area for two roles:

| Role | Access |
|------|--------|
| **Admin** | Tours, staff accounts, gallery (upload + delete), POS sales and reports, site settings |
| **Staff** | POS only, and gallery upload only — no delete, no reports, no tour or staff management |

Customers do not book or pay online in Phase 1. All money is taken at the counter
through the POS. Online booking with payment is a separately quoted Phase 2.

## Agreed stack

- **Next.js (App Router) + TypeScript**, deployed on **Vercel**
- **Postgres** (Neon or Supabase) via Prisma or Drizzle
- **Auth.js (NextAuth)** credentials provider, or Supabase Auth, with a `role` field
- **Hosted image storage** (Vercel Blob / Cloudinary / Supabase Storage) — Vercel's
  filesystem is read-only and ephemeral, so nothing is stored on disk
- **Tailwind CSS**, mobile-first

## Project layout

```
app/
  layout.tsx              Root layout: fonts, metadata, header, footer
  page.tsx                Home — hero, tours, why us, how booking works
  tours/page.tsx          Tour list with prices
  tours/[slug]/page.tsx   Tour detail, prerendered per tour
  contact/page.tsx        Contact and location
  components/             Header and footer
  globals.css             Tailwind theme tokens (river and sand palettes)
lib/tours.ts              Tour catalogue and site config  ← placeholder data
public/                   Static assets only (no user uploads)
docs/                     Brief, checklist, WhatsApp message
```

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build, must pass before merging
npm run lint
```

Requires Node 20 or newer. `package-lock.json` pins the exact dependency versions.

Copy `.env.example` to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

The public pages currently read only `NEXT_PUBLIC_WHATSAPP_NUMBER` and
`NEXT_PUBLIC_SITE_URL`, both of which have safe fallbacks, so the site runs with no
environment file at all. Every other variable is for the portal and is unused so far.

## Placeholders to replace before launch

These are deliberately fake and must not go live as-is:

- **Tour prices and descriptions** — `lib/tours.ts`. The real rates come from the operator.
- **WhatsApp number** — `NEXT_PUBLIC_WHATSAPP_NUMBER` in Vercel (fallback is a dummy).
- **Base camp address, opening hours, pickup areas** — `app/contact/page.tsx`.
- **Photography** — there are no photos yet; tour cards use gradient panels. Images belong in
  hosted object storage, never in `public/`.

Until the portal exists, these are edited in code. After the portal exists, they are admin-editable.

## Ownership

This repository is owned by the `appsdaeng` organisation. The developer works here as a
collaborator. The Vercel project, database, image storage and domain are all owned by the
repository owner — nothing is hosted in the developer's own accounts.

## Branch and deploy model

- `main` is production. Every push to `main` deploys automatically via Vercel.
- `develop` is the integration branch; Vercel preview deployments are used for review.
- Nothing is merged to `main` without a successful preview build.

## Deploying to Vercel

Import the repository with the **Next.js** preset and leave the build and output settings
on their defaults (`next build`, `.next`, `npm install`). Set the root directory to the
repository root. Pin the Node version to 20 or 22 in Settings → General.

Environment variables live in **Vercel → Settings → Environment Variables**, never in this
repository. Set `NEXT_PUBLIC_*` values before the first build — they are inlined at build
time, so changing them later requires a redeploy. Mark every secret as sensitive.

Required today: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`.
Required once the portal lands: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, image storage
credentials, and Upstash Redis for login rate limiting. See `.env.example`.

## Not built yet

- Auth, the `role` field and server-side role checks
- Database schema and migrations
- POS, receipts and reports
- Gallery upload to hosted storage
- Admin portal for tours, staff and site settings

## Creating an admin

*(To be documented when auth is implemented — includes the seed/bootstrap process and
how to add further admin accounts.)*
