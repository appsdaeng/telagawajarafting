# Telaga Waja Rafting — Website, Admin & Staff Portal

Public website and internal point-of-sale for Telaga Waja Rafting, Bali.

**Status: specification stage.** This repository currently holds the project brief and
delivery checklist. The application code is not written yet.

- [`docs/BRIEF.md`](docs/BRIEF.md) — the full brief: scope, stack, roles, security, commercials
- [`docs/DELIVERY-CHECKLIST.md`](docs/DELIVERY-CHECKLIST.md) — how the finished work is reviewed
- [`docs/WHATSAPP.md`](docs/WHATSAPP.md) — short version of the brief for initial contact

## What the project is

A customer-facing site (Home, About, Tours, Tour detail, Gallery, Contact) with a
WhatsApp "Book Now" enquiry button, plus a login area for two roles:

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

## Ownership

This repository is owned by the `appsdaeng` organisation. The developer works here as a
collaborator. The Vercel project, database, image storage and domain are all owned by the
repository owner — nothing is hosted in the developer's own accounts.

## Branch and deploy model

- `main` is production. Every push to `main` deploys automatically via Vercel.
- `develop` is the integration branch; Vercel preview deployments are used for review.
- Nothing is merged to `main` without a successful preview build.

## Environment variables

Secrets are set in **Vercel → Settings → Environment Variables**, never committed here.
Copy `.env.example` to `.env.local` for local development and fill in real values:

```bash
cp .env.example .env.local
```

The keys required are listed in `.env.example`. Any new variable must be added there
(with a dummy value) in the same commit that starts using it.

## Local development

*(To be completed when the application scaffold lands — the README must eventually let
someone clone this repo on a clean machine and run it by following these steps alone.)*

## Creating an admin

*(To be documented when auth is implemented — includes the seed/bootstrap process and
how to add further admin accounts.)*
