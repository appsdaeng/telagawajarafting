# Delivery Review Checklist

Work top to bottom. The **role tests in §3 are the most important** — a site that looks finished usually fails them, and they are the ones that cause real damage (a staff member deleting tours, or a stranger reading sales data).

## 1. Ownership — check this before paying anything

- [ ] GitHub repo is under **your** account/org; you are the owner, not a collaborator on someone else's repo
- [ ] Vercel project is in **your** team/account, connected to that repo
- [ ] Pushing a commit to `main` actually triggers a deploy (do it yourself once)
- [ ] Neon/Supabase project, image-storage account, Upstash/rate-limit account — all in **your** name, with you as owner
- [ ] Domain DNS you control; you can see the records
- [ ] No secrets in the repo: search GitHub for `postgres://`, `sk_`, `secret`, `password` — nothing real should appear
- [ ] `.env.example` exists and lists every variable the app needs
- [ ] You can log in to every service without the developer

## 2. Public site

- [ ] Home, About, Tours, Tour detail, Gallery, Contact all load on the real domain
- [ ] Tour detail shows price adult/child, duration, inclusions, meeting point, photos, WhatsApp button
- [ ] WhatsApp button opens WhatsApp with the tour name pre-filled
- [ ] Looks right on a phone, not just a laptop (real phone, not just a resized window)
- [ ] Page titles and meta descriptions are unique per page (view source, not just the tab)
- [ ] `/sitemap.xml` and `/robots.txt` load
- [ ] Hidden/unpublished tours are not reachable — try `/tours/<slug-of-hidden-tour>`
- [ ] Change a price in admin settings → it changes on the public site (not hard-coded)
- [ ] HTTPS padlock, no mixed-content warnings

## 3. Roles and access — the critical section

Create a test staff account first.

- [ ] Staff login shows **only** POS and Gallery in the menu
- [ ] Logged in as staff, type `/admin` in the address bar → **blocked** (403 or redirect), not a rendered admin page
- [ ] Same for `/admin/tours`, `/admin/staff`, `/admin/reports`, `/admin/settings`
- [ ] Same for the underlying API/actions: with staff cookies, POST to a tour-delete or staff-create endpoint → **rejected**. (Ask the developer to demo this, or use browser devtools to replay a request.)
- [ ] Staff cannot delete a gallery image — no delete control, **and** the delete request itself is refused
- [ ] Logged out, `/admin` and `/staff` redirect to login; the login page does not leak whether an email exists
- [ ] After logging out, the Back button does not show cached admin pages
- [ ] Deactivate a staff account while it is logged in → its session stops working (ask: how long until it does?)

## 4. Security

- [ ] Passwords are hashed in the database — ask to see one row; it must be a bcrypt/argon2 hash, not readable text
- [ ] Wrong password 6+ times in a row → **rate limited** (wait, blocked, or captcha), not unlimited retries
- [ ] Upload a `.exe` renamed to `.jpg` → rejected
- [ ] Upload a 20 MB image → rejected with a clear message, not a crash
- [ ] Uploaded images are resized/compressed (check the file size of what is served)
- [ ] Session cookie is `HttpOnly` + `Secure` (devtools → Application → Cookies)
- [ ] Error pages do not show stack traces or SQL

## 5. POS

- [ ] Select tour → guests (adult/child) → date/time → payment method → receipt
- [ ] **Total is calculated correctly** for a mixed adult+child sale — check the arithmetic by hand
- [ ] All three payment methods (cash, card, transfer/QR) work and are recorded
- [ ] Receipt is printable / sendable on a phone
- [ ] Sale appears in admin reports immediately
- [ ] Change a tour price, then re-open an **old** receipt → it still shows the old price (history not rewritten)
- [ ] Sales by date range, by tour, and by payment method all reconcile with the sales you made

## 6. Staff management and passwords

- [ ] Admin can add a staff member; that person can log in
- [ ] Admin can reset a password; the old one stops working
- [ ] Removing/deactivating staff actually blocks them
- [ ] You personally created a second admin account and logged in with it — so you are not dependent on the credentials you were given

## 7. Handover

- [ ] README covers: local setup from scratch, env vars, migrations, deploy, **how to create an admin**, how to add staff
- [ ] You can run the project locally by following the README alone, on a fresh clone
- [ ] Video/guide covers creating a tour and adding a staff member
- [ ] First admin credentials handed over privately (and changed by you afterwards)
- [ ] 2 weeks of bug fixes confirmed in writing, with a way to report them
- [ ] Phase-2 (booking + payment) price received in writing for future budgeting

## Red flags that justify holding payment

- "The repo is on my account, I'll transfer it later."
- "Role checking is done in the UI."
- Secrets committed then deleted in a later commit — the history still contains them, so keys must be **rotated**, not just removed.
- No rate limiting "because it's behind a login anyway."
- Images saved into the repo or `/public`.
- Reports that only sum the last N sales, or totals that disagree with the receipts.
- No `.env.example`, or a README that only works on the developer's machine.
