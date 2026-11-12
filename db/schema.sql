-- Telaga Waja Rafting — portal schema (Postgres 15+).
--
-- This mirrors the migrations applied to Supabase (0001_core_catalogue_and_users,
-- 0002_bookings_payments_ops). Apply it to a fresh database with:
--
--   psql "$DIRECT_URL" -f db/schema.sql
--
-- It is written to be safe to re-run: every object is created only when missing
-- and the seed rows use ON CONFLICT DO NOTHING.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  password_hash text not null,
  role text not null default 'STAFF' check (role in ('ADMIN', 'STAFF')),
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_key on public.users (lower(email));

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  story text[] not null default '{}',
  includes text[] not null default '{}',
  highlights text[] not null default '{}',
  good_to_know text[] not null default '{}',
  price_adult integer not null default 0 check (price_adult >= 0),
  price_child integer not null default 0 check (price_child >= 0),
  pricing_options jsonb not null default '[]'::jsonb,
  duration text not null default '',
  meeting_point text not null default '',
  image_url text not null default '',
  image_alt text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  popular boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tours_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create unique index if not exists tours_slug_key on public.tours (slug);

-- Added after the first release; the ALTER keeps re-running this file on an
-- existing database safe.
alter table public.tours
  add column if not exists pricing_options jsonb not null default '[]'::jsonb;

create table if not exists public.tour_departures (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours (id) on delete cascade,
  time text not null check (time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  capacity integer not null default 10 check (capacity > 0),
  active boolean not null default true,
  unique (tour_id, time)
);

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  tour_id uuid references public.tours (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  -- A null tour_id means "every tour", so nulls must collide for the upserts.
  unique nulls not distinct (date, tour_id)
);

create table if not exists public.special_prices (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  tour_id uuid references public.tours (id) on delete cascade,
  price_adult integer not null check (price_adult >= 0),
  price_child integer not null check (price_child >= 0),
  label text not null default '',
  created_at timestamptz not null default now(),
  unique nulls not distinct (date, tour_id)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  tour_id uuid not null references public.tours (id),
  booking_date date not null,
  departure_time text not null check (departure_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  adults integer not null default 0 check (adults >= 0),
  children integer not null default 0 check (children >= 0),
  total_amount integer not null default 0 check (total_amount >= 0),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  source text not null default 'ONLINE'
    check (source in ('ONLINE', 'POS', 'WHATSAPP')),
  guest_name text not null default '',
  guest_email text not null default '',
  guest_phone text not null default '',
  hotel text not null default '',
  notes text not null default '',
  internal_notes text not null default '',
  payment_status text not null default 'UNPAID'
    check (payment_status in ('UNPAID', 'PENDING', 'PAID', 'REFUNDED', 'FAILED')),
  payment_method text not null default '',
  created_by uuid references public.users (id),
  cancelled_at timestamptz,
  cancellation_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bookings_code_key on public.bookings (code);
create index if not exists bookings_date_idx on public.bookings (booking_date);
create index if not exists bookings_departure_idx
  on public.bookings (tour_id, booking_date, departure_time);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  provider text not null default 'MANUAL',
  provider_ref text,
  method text not null default '',
  amount integer not null default 0,
  status text not null default 'PENDING'
    check (status in ('PAID', 'PENDING', 'FAILED', 'REFUNDED', 'UNPAID')),
  raw jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments (booking_id);
create index if not exists payments_provider_ref_idx on public.payments (provider_ref);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text not null,
  caption text not null default '',
  category text not null default 'rafting'
    check (category in ('rafting', 'river', 'team', 'guests')),
  sort_order integer not null default 0,
  approved boolean not null default false,
  uploaded_by uuid references public.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users (id),
  actor_email text not null default '',
  action text not null,
  entity text not null default '',
  entity_id text not null default '',
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null default '',
  ip text not null default '',
  ok boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_created_idx
  on public.login_attempts (created_at desc, email, ip);

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'custom',
  to_email text not null default '',
  from_email text not null default '',
  subject text not null default '',
  status text not null default 'queued',
  provider_id text not null default '',
  error text not null default '',
  booking_id uuid references public.bookings (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists email_log_created_idx on public.email_log (created_at desc);

-- Defaults the portal reads before an admin saves anything.
insert into public.site_settings (key, value) values
  ('business', '{"name":"Telaga Waja Rafting","whatsapp":"6281234567890","email":"booking@telagawajarafting.com","address":"Jl. Raya Rendang, Rendang, Karangasem, Bali 80863","hours":"Every day, 07:00 - 17:00","pickupAreas":"Ubud, Seminyak, Kuta, Sanur and Canggu. Other areas on request."}'::jsonb),
  ('payments', '{"gatewayEnabled":false,"provider":"midtrans","sandbox":true,"currency":"IDR","depositPercent":0,"methods":["card","qris","ewallet","paypal","googlepay","applepay","cash"]}'::jsonb),
  ('notifications', '{"sendgridEnabled":false,"bookingFrom":"booking@telagawajarafting.com","cancelFrom":"cancel@telagawajarafting.com","financeFrom":"finance@telagawajarafting.com","notifyBooking":true,"notifyCancel":true,"notifyPayment":true}'::jsonb),
  ('booking', '{"minAdvanceDays":1,"maxPartySize":20,"allowCashAtVenue":true,"venueOnlyCash":true}'::jsonb)
on conflict (key) do nothing;

-- No users are seeded. The first ADMIN is created once at /admin/setup, which
-- refuses to run again as soon as one account exists.
