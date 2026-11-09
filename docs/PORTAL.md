# Staff portal and online booking

The site is public; `/admin` is the staff portal. Both run on the same Next.js
app, so bookings taken at the counter and bookings taken online share one
inventory and cannot oversell a departure.

## What is where

| Path | Who | Purpose |
| --- | --- | --- |
| `/` | public | Marketing site, live availability, online booking |
| `/book/confirmed?code=…` | public | Booking receipt, found by code |
| `/admin/setup` | nobody signed in | One-time creation of the first ADMIN |
| `/admin` | ADMIN | Overview: today, week, month, alerts |
| `/admin/bookings` | ADMIN | Filters, detail, CSV export |
| `/admin/pos` | ADMIN + STAFF | Walk-in sales at the counter |
| `/admin/tours` | ADMIN | Tour copy, prices, photos, SEO |
| `/admin/availability` | ADMIN | Departures, seats, blocked dates, peak prices |
| `/admin/payments` | ADMIN | Payments, methods, daily cash close |
| `/admin/gallery` | ADMIN + STAFF | Photos; staff uploads wait for approval |
| `/admin/staff` | ADMIN | Accounts, roles, password resets |
| `/admin/settings` | ADMIN | Contact details and opening hours |
| `/admin/system` | ADMIN | Payment gateway, email, recent sends |

Roles are re-read from the database on every page and every mutation, so a
deactivated account loses access immediately even with a live cookie. Staff can
only reach POS and the gallery.

## First run

1. Set the environment variables (see `.env.example`) in Vercel.
2. Apply the schema to the database:

   ```bash
   psql "$DIRECT_URL" -f db/schema.sql
   ```

3. Open `https://<your-domain>/admin/setup` and create the owner account. The
   page and the action both refuse to run once a single user exists.
4. Add staff from **Admin → Staff**. Give each person their own account; the
   audit log records who did what.

Without `DATABASE_URL` the public site still renders, `/api/availability`
answers 503, and `/admin/login` says the database is not configured.

## Required environment variables

| Variable | Needed for |
| --- | --- |
| `DATABASE_URL` | everything in the portal |
| `AUTH_SECRET` | signing session cookies (32+ characters) |
| `RESEND_API_KEY` or `SENDGRID_API_KEY` | booking, cancellation and payment email |
| `MIDTRANS_SERVER_KEY` | online card / QRIS / e-wallet payments |

`AUTH_SECRET` is not optional in production: without it the portal refuses to
sign cookies rather than issuing an unsigned one.

## Email

Every notification is attempted through Resend (SendGrid as fallback) and the
result is written to `email_log`, including the provider's error message. With
no key the row is stored as `skipped` rather than the send failing silently.
**Admin → System** lists the last twelve attempts and has a "send a test" form
per sender identity, which is the quickest way to prove a domain is verified.

## Payment gateway (Midtrans)

The gateway is off until an admin switches it on in **Admin → System**, and it
only works when `MIDTRANS_SERVER_KEY` is set. With it on:

- online bookings create a Snap transaction and send the guest to Midtrans
- the booking is held as `PENDING` until the webhook confirms payment
- `/api/payments/midtrans/webhook` verifies the sha512 signature before it
  changes anything, and answers 200 to valid notifications it cannot act on
- `settlement`/`capture` marks the booking paid and confirmed; `deny`, `cancel`,
  `expire` and `failure` mark it failed; `refund` marks it refunded and cancels
  the booking

Register the notification URL in Midtrans: `https://<domain>/api/payments/midtrans/webhook`.
Use the sandbox key with **Sandbox mode** ticked until a real transaction has
been taken end to end.

With the gateway off, an online booking is still created and confirmed by hand —
the site behaves exactly as it did before the portal existed.

## Seat inventory

Capacity lives in `tour_departures.capacity`. Creating a booking locks the
departure row, counts the seats already taken (anything not `CANCELLED`), and
refuses the booking when the party does not fit. That is what stops a POS sale
and an online booking taking the last seat at the same time.

## Known gaps

- **Public tour pages still read `lib/tours.ts`.** The portal edits the `tours`
  table, which drives POS and bookings, but the marketing pages have not been
  switched over. Until then, change prices in both places.
- **Gallery uploads are URL based.** Files must be uploaded to Supabase Storage,
  Vercel Blob or Cloudinary first; the form stores the URL plus alt text. No
  WebP conversion or resizing happens in the app.
- **No customer CRM.** Bookings keep guest details, but there is no separate
  customers table or history view.
