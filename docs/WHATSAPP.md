# Short WhatsApp message to send the developer

> Hi [Name], here's the Telaga Waja Rafting project. Full brief attached as a PDF — short version below.
>
> **What it is:** a public website for the rafting business, plus a login area for staff.
>
> **Public site:** Home, About, Tours, Tour detail (price adult/child, duration, what's included, meeting point, photos, WhatsApp "Book Now"), Gallery, Contact. Must be fast on mobile and good for Google.
>
> **Roles:**
> - Admin — manage tours, staff accounts, gallery, POS sales & reports, site settings (prices, contact info).
> - Staff — **only** POS (select tour, guests, date/time, cash/card/transfer, receipt) and Gallery upload. No delete, no reports, no tour management.
>
> **Stack:** Next.js (App Router) + TypeScript on Vercel, Postgres (Neon or Supabase), Auth.js with a role field, hosted image storage (Vercel Blob / Cloudinary / Supabase — no local disk, Vercel is serverless), Tailwind.
>
> **Non-negotiables:**
> - The GitHub repo is **mine**, you're added as collaborator. Vercel project is **mine**. Everything (database, storage, domain) in my name.
> - Push to `main` → auto-deploy. Testing on a `develop` branch / preview deploys.
> - Secrets in Vercel env vars only, never in GitHub. `.env.example` in the repo.
> - Passwords hashed (bcrypt/argon2). **Role checks on the server** — middleware, server actions, API routes. Not just hidden buttons.
> - Rate limit on login. Image uploads validated (type + size) and auto-compressed.
>
> **Scope decisions already made:** no online booking/payment in phase 1 — all sales go through the POS, customers enquire via WhatsApp. Email only optional. Domain I'll supply. Online booking + payment is a separate phase-2 quote.
>
> **Delivery:** live on my domain, README (local setup, deploy, how to create an admin), first admin account for me, and a short video showing how to add a tour and add a staff member.
>
> Can you send: fixed price with milestone breakdown, timeline with dates, which services you'd pick and why, 2–3 links to similar Next.js + Postgres sites you've built, and a separate phase-2 price?
>
> Happy to jump on a call this week.

---

**Follow-up if they're slow to answer the ownership question** — this is the one that matters most:

> One thing I want to be clear on before we start: the repo needs to be created under my GitHub account and the Vercel project under mine, with me as the account owner on the database and image storage too. You'd be a collaborator. Is that fine?
