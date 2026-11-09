import { databaseConfigured, sql } from "@/lib/db";

export type BusinessSettings = {
  name: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  pickupAreas: string;
};

export type PaymentSettings = {
  gatewayEnabled: boolean;
  provider: "midtrans";
  sandbox: boolean;
  currency: string;
  depositPercent: number;
  methods: string[];
};

export type NotificationSettings = {
  sendgridEnabled: boolean;
  bookingFrom: string;
  cancelFrom: string;
  financeFrom: string;
  notifyBooking: boolean;
  notifyCancel: boolean;
  notifyPayment: boolean;
};

export type BookingSettings = {
  minAdvanceDays: number;
  maxPartySize: number;
  allowCashAtVenue: boolean;
  venueOnlyCash: boolean;
};

export const defaultBusiness: BusinessSettings = {
  name: "Telaga Waja Rafting",
  whatsapp: "6281234567890",
  email: "booking@telagawajarafting.com",
  address: "Jl. Raya Rendang, Rendang, Karangasem, Bali 80863",
  hours: "Every day, 07:00 – 17:00",
  pickupAreas: "Ubud, Seminyak, Kuta, Sanur and Canggu. Other areas on request.",
};

export const defaultPayments: PaymentSettings = {
  gatewayEnabled: false,
  provider: "midtrans",
  sandbox: true,
  currency: "IDR",
  depositPercent: 0,
  methods: ["card", "qris", "ewallet", "paypal", "googlepay", "applepay", "cash"],
};

export const defaultNotifications: NotificationSettings = {
  sendgridEnabled: false,
  bookingFrom: "booking@telagawajarafting.com",
  cancelFrom: "cancel@telagawajarafting.com",
  financeFrom: "finance@telagawajarafting.com",
  notifyBooking: true,
  notifyCancel: true,
  notifyPayment: true,
};

export const defaultBookingSettings: BookingSettings = {
  minAdvanceDays: 1,
  maxPartySize: 20,
  allowCashAtVenue: true,
  venueOnlyCash: true,
};

/** Read one settings row, falling back when the database or key is missing. */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  if (!databaseConfigured) {
    return fallback;
  }

  try {
    const rows = await sql<{ value: T }[]>`select value from site_settings where key = ${key} limit 1`;
    return rows[0]?.value ?? fallback;
  } catch {
    return fallback;
  }
}

/** Upsert one settings row. Callers already checked the session role. */
export async function saveSetting(key: string, value: unknown): Promise<void> {
  await sql`
    insert into site_settings (key, value, updated_at)
    values (${key}, ${sql.json(value as never)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
}

export const getBusiness = () => getSetting("business", defaultBusiness);
export const getPaymentSettings = () => getSetting("payments", defaultPayments);
export const getNotificationSettings = () => getSetting("notifications", defaultNotifications);
export const getBookingSettings = () => getSetting("booking", defaultBookingSettings);
