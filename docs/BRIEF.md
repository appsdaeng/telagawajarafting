# Project Brief — Telaga Waja Rafting Website + Admin/Staff Portal

**Owner:** [Your name] · **Business:** Telaga Waja Rafting, Bali
**Prepared:** 7 November 2026 · **Version:** 1.0

---

## 0. Decisions confirmed (answers to the questions that affect price)

These are settled, so please quote against them.

| # | Question | Decision |
|---|----------|----------|
| 1 | Online booking & customer payment? | **No.** Phase 1 is brochures + enquiry only. Customers see tours, prices and a **WhatsApp "Book Now"** button. All money is taken at the counter through the **POS**. Online booking + payment gateway is a **priced Phase 2 option** — quote it separately, do not include it in Phase 1. |
| 2 | Confirmation method | **WhatsApp is the primary channel** (enquiry button, and POS receipts can be sent as a WhatsApp link/PDF). **Email is optional**: only used if the customer voluntarily gives an address, for a copy of the receipt. No email marketing, no transactional email service required in Phase 1. |
| 3 | Domain name | **Owner supplies the domain.** Developer must document exactly which DNS records to add and in what order, and must not register or pay for the domain. If nothing is registered yet, we will register one (approx. USD 12/year) — say so early so it does not block launch. |

**Phase 2 (quote separately, not now):** online booking with deposit, availability calendar, payment gateway (Midtrans/Xendit for IDR), automated WhatsApp/email confirmations.

---

## 1. Hosting and code ownership

- Code lives in the repository **`appsdaeng/telagawajarafting`** — <https://github.com/appsdaeng/telagawajarafting> — which I own. It already exists and is empty; the developer is added as a **collaborator**. Do not fork it into a personal account, and do not host the canonical repository anywhere else.
- First commit is `main` with the README, `.gitignore` and `.env.example`; create a `develop` branch from it and open pull requests into `main`.
- Production deploys on **Vercel under my Vercel account**. The repo is connected to Vercel so **every push to `main` deploys automatically**.
- Work happens on a `develop` branch and/or **Vercel preview deployments**; `main` is production and must stay deployable.
- **No secrets in GitHub.** Database URL, auth secret and any API keys are set in **Vercel → Settings → Environment Variables** (separate values for Production and Preview). The repo ships a `.env.example` listing every required variable with dummy values.
- Vercel is serverless: the filesystem is **read-only and ephemeral**. Uploaded images must go to **hosted object storage** (Vercel Blob / Cloudinary / Supabase Storage), never to `/public` or the local disk.

## 2. Stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js (App Router) + TypeScript** |
| Database | **Postgres** — Neon or Supabase (owner's account) |
| ORM | Prisma or Drizzle (developer's pick, migrations committed) |
| Auth | **Auth.js (NextAuth)** credentials provider, or Supabase Auth — whichever, with a `role` field (`ADMIN` / `STAFF`) |
| Image storage | Vercel Blob, Cloudinary, or Supabase Storage (owner's account) |
| Styling | **Tailwind CSS**, mobile-first |
| Validation | Zod (or equivalent) on every form and API boundary |

Alternatives are welcome, but they must keep: Postgres, server-enforced roles, hosted image storage, and deploy-to-Vercel-on-push.

## 3. Public website (customers)

Pages: **Home · About · Tours · Tour detail · Gallery · Contact**

Tour detail must show:
- Name and description
- Price **adult / child** (IDR)
- Duration
- What's included (pickup, lunch, equipment, insurance, etc.)
- Meeting point
- Photo gallery
- **"Book Now" → WhatsApp** deep link pre-filled with the tour name, plus a phone/email contact line

Non-functional: mobile-first, fast (target Lighthouse mobile ≥ 90), SEO basics — per-page `<title>` and meta description, Open Graph images, `sitemap.xml`, `robots.txt`, semantic headings, alt text on all images. Prices and contact details come from **site settings in the database**, not hard-coded in components.

## 4. Roles

### Admin — full access
- Tours: create, edit, delete, **hide/show** (hidden tours are not public but keep their data), reorder
- Staff accounts: create, remove/deactivate, reset password
- Gallery: upload **and delete**, edit captions/alt text
- POS sales and reports (by date range, by tour, totals, payment-method breakdown)
- Site settings: contact info, WhatsApp number, prices, about text

### Staff — deliberately limited
Only two sections, nothing else:
- **POS:** select tour → number of guests (adult/child) → date & time → payment method (**cash, card, transfer/QR**) → issue receipt
- **Gallery:** upload images only. **No delete, no edit, no access to tours, staff, reports or settings.**

## 5. Security requirements

- Passwords hashed with **bcrypt (cost ≥ 12) or argon2**. Never stored or logged in plain text.
- **Role checks on the server** — in server actions, route handlers **and** middleware. Hiding menu items is not access control. Every admin-only mutation must re-check the session role server-side.
- Route protection: `/admin/*` = ADMIN only, `/staff/*` = STAFF (or ADMIN). Unauthenticated → login. Wrong role → 403 or redirect, never a partially rendered admin page.
- Session cookies `HttpOnly`, `Secure`, `SameSite=Lax`. Auth secret is a random 32+ byte value in Vercel env vars.
- **Rate limiting on login** (and on password reset): per-IP and per-account, e.g. 5 attempts / 15 min, backed by Upstash Redis or Vercel KV — in-memory counters do not work across serverless instances.
- **Image upload validation:** allow-list MIME types (JPEG/PNG/WebP), hard size cap (e.g. 5 MB in), **server-side magic-byte check** (not just the extension), automatic resize/compression (max ~2000 px wide, WebP quality ~80), random filenames, no path traversal.
- Public forms (contact/enquiry) validated and rate limited. No stack traces or DB errors shown to users.
- No secrets, no service-role keys and no admin credentials in client bundles.

## 6. Data model (minimum)

`User` (id, email, name, passwordHash, role, active, createdAt) · `Tour` (id, slug, name, description, priceAdult, priceChild, durationMinutes, includes[], meetingPoint, published, images[], order) · `GalleryImage` (id, url, alt, caption, uploadedBy, createdAt) · `Sale` (id, tourId, staffId, adults, children, amount, paymentMethod, soldAt) · `SaleItem`/`Receipt` (receipt number, printed snapshot of prices so old receipts stay correct after a price change) · `SiteSetting` (key/value).

Receipts must be reproducible after the fact: store the price **at time of sale**, not a live lookup.

## 7. Delivery

1. Site live on **my Vercel account** and **my domain**, HTTPS.
2. **README** in the repo: local setup, env vars, database migrations, deploy steps, **how to create an admin**, how to add a staff member, how image storage is configured.
3. **First admin account created for me** (credentials handed over privately, and a documented way to create more).
4. **Short video or written guide** (≤ 5 min) showing: create a tour, add a staff member, take a POS sale.
5. **Handover:** repo ownership, Vercel project, Neon/Supabase project, image-storage account and domain all in **my** name. I keep working access to everything.

## 8. Costs to expect (for budgeting, not a developer fee)

| Item | Typical |
|------|---------|
| Domain | ~USD 12/year |
| Vercel | Hobby is free but **not licensed for commercial use** — budget **Pro ~USD 20/month** |
| Neon / Supabase Postgres | Free tier is fine at this size; ~USD 0–25/month |
| Image storage (Vercel Blob / Cloudinary / Supabase) | Free tier likely sufficient; a few USD/month if gallery grows |
| Upstash Redis (login rate limiting) | Free tier sufficient |
| SSL, HTTPS | Included with Vercel |

Every one of these must be created under **my** accounts. State clearly how long each free tier lasts, and what happens when it runs out.

## 9. Commercials

- **Fixed price, paid by milestone** — proposals should break the work into milestones with a percentage each, not one lump sum.
- Suggested milestones: (1) repo + scaffold + deploy pipeline live — 20%; (2) auth + roles + admin tours — 25%; (3) POS + reports — 25%; (4) gallery + uploads + public site — 20%; (5) README, handover, video, launch — 10%.
- **Timeline** with dates, and a clear definition of "done" per milestone.
- **2 weeks of bug fixes after launch** included; separately priced maintenance thereafter.
- All code, assets and accounts transfer to me on final payment. No licence fees, no developer lock-in, no "hosting only through me."

## 10. What a proposal must include

1. Fixed price + milestone breakdown + timeline with dates.
2. Which stack choices you made from §2 and why (especially image storage and auth).
3. Two or three live links to comparable Next.js + Postgres projects you built.
4. Who owns/hosts each service, and confirmation that everything is in my name.
5. Price for Phase 2 (online booking + payment) as a separate line — for planning only.
