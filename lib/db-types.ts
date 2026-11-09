/** Row shapes returned by the queries in `lib/`. Mirrors db/schema.sql. */

export type Role = "ADMIN" | "STAFF";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type TourRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  story: string[];
  includes: string[];
  highlights: string[];
  good_to_know: string[];
  price_adult: number;
  price_child: number;
  duration: string;
  meeting_point: string;
  image_url: string;
  image_alt: string;
  seo_title: string;
  seo_description: string;
  popular: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export type DepartureRow = {
  id: string;
  tour_id: string;
  time: string;
  capacity: number;
  active: boolean;
};

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REFUNDED" | "FAILED";
export type BookingSource = "ONLINE" | "POS" | "WHATSAPP";

export type BookingRow = {
  id: string;
  code: string;
  tour_id: string;
  booking_date: string;
  departure_time: string;
  adults: number;
  children: number;
  total_amount: number;
  status: BookingStatus;
  source: BookingSource;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  hotel: string;
  payment_status: PaymentStatus;
  payment_method: string;
  notes: string;
  internal_notes: string;
  created_by: string | null;
  cancelled_at: string | null;
  cancellation_reason: string;
  created_at: string;
};

export type BookingWithTour = BookingRow & {
  tour_name: string;
  tour_slug: string;
};

export type PaymentRow = {
  id: string;
  booking_id: string;
  provider: string;
  provider_ref: string | null;
  method: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export type GalleryRow = {
  id: string;
  url: string;
  alt: string;
  caption: string;
  category: "rafting" | "river" | "team" | "guests";
  sort_order: number;
  approved: boolean;
  uploaded_by: string | null;
  created_at: string;
};

export type AuditRow = {
  id: string;
  actor_email: string;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
};

export type EmailLogRow = {
  id: string;
  kind: string;
  to_email: string;
  from_email: string;
  subject: string;
  status: string;
  error: string;
  created_at: string;
};
