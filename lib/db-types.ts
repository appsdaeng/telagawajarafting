/** Row shapes returned by the queries in `lib/`. Mirrors db/migrations/*.sql. */

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

/** One price band inside an option, e.g. Adult / Child with its own guest range. */
export type TourTier = {
  name: string;
  price: number;
  min: number;
  max: number;
  priceType: string;
};

/** An extra question the guest answers when booking this option. */
export type TourOptionField = {
  /** Short internal name from older fields; the editor no longer shows it. */
  name: string;
  /** The short heading the guest reads, on one line. */
  label: string;
  /** The text shown under the heading; may run over several lines. */
  text?: string;
  /** "Text", "Dropdown Selector" or "Read Only" (information, no answer). */
  type: string;
  /** The choices a dropdown offers; empty for a text field. */
  options: string[];
  required: boolean;
};

/**
 * A bookable option on a tour.
 *
 * `price` and `field` are the flattened values the public tour page still
 * reads: the cheapest tier price and the label of the first tier. The full
 * tier and guest-field lists live alongside them so the admin editor can
 * round-trip what the operator typed without changing the public page.
 */
export type TourOption = {
  name: string;
  description: string;
  price: number;
  field: string;
  tiers?: TourTier[];
  fields?: TourOptionField[];
  active?: boolean;
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
  gallery_urls: string[];
  itinerary: string[];
  pricing_options: TourOption[];
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
