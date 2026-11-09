"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { requireAdmin, requireUser, type SessionUser } from "@/lib/auth";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import {
  BookingError,
  createBooking,
  getTourById,
  rescheduleBooking,
  setBookingStatus,
  setPaymentStatus,
} from "@/lib/bookings";
import { sql } from "@/lib/db";
import {
  notifyBookingCancelled,
  notifyBookingCreated,
  notifyPaymentReceived,
  sendEmail,
  type EmailKind,
} from "@/lib/email";
import {
  getNotificationSettings,
  saveSetting,
  type BusinessSettings,
  type NotificationSettings,
  type PaymentSettings,
} from "@/lib/settings";

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function number(form: FormData, key: string, fallback = 0): number {
  const value = Number(form.get(key));
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

function checkbox(form: FormData, key: string): boolean {
  const value = form.get(key);
  return value === "on" || value === "true" || value === "1";
}

function lines(form: FormData, key: string): string[] {
  return text(form, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function audit(user: SessionUser, action: string, entity: string, entityId: string, meta = {}) {
  return writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action,
    entity,
    entityId,
    meta,
  });
}

/* -------------------------------------------------------------------------- */
/* Tours                                                                       */
/* -------------------------------------------------------------------------- */

export async function saveTourAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = text(form, "id");
  const name = text(form, "name");
  const path = id ? `/admin/tours/${id}` : "/admin/tours/new";

  if (!name) {
    fail(path, "A tour needs a name.");
  }

  const slug = slugify(text(form, "slug") || name);

  if (!slug) {
    fail(path, "A tour needs a URL slug.");
  }

  const values = {
    slug,
    name,
    tagline: text(form, "tagline"),
    description: text(form, "description"),
    story: lines(form, "story"),
    includes: lines(form, "includes"),
    highlights: lines(form, "highlights"),
    good_to_know: lines(form, "good_to_know"),
    price_adult: number(form, "price_adult"),
    price_child: number(form, "price_child"),
    duration: text(form, "duration"),
    meeting_point: text(form, "meeting_point"),
    image_url: text(form, "image_url"),
    image_alt: text(form, "image_alt"),
    seo_title: text(form, "seo_title"),
    seo_description: text(form, "seo_description"),
    popular: checkbox(form, "popular"),
    published: checkbox(form, "published"),
    sort_order: number(form, "sort_order"),
  };

  try {
    if (id) {
      await sql`
        update public.tours set
          slug = ${values.slug}, name = ${values.name}, tagline = ${values.tagline},
          description = ${values.description}, story = ${values.story},
          includes = ${values.includes}, highlights = ${values.highlights},
          good_to_know = ${values.good_to_know}, price_adult = ${values.price_adult},
          price_child = ${values.price_child}, duration = ${values.duration},
          meeting_point = ${values.meeting_point}, image_url = ${values.image_url},
          image_alt = ${values.image_alt}, seo_title = ${values.seo_title},
          seo_description = ${values.seo_description}, popular = ${values.popular},
          published = ${values.published}, sort_order = ${values.sort_order},
          updated_at = now()
        where id = ${id}
      `;
      await audit(user, "updated_tour", "tour", id, { name, slug });
    } else {
      const rows = await sql<{ id: string }[]>`
        insert into public.tours (
          slug, name, tagline, description, story, includes, highlights, good_to_know,
          price_adult, price_child, duration, meeting_point, image_url, image_alt,
          seo_title, seo_description, popular, published, sort_order
        ) values (
          ${values.slug}, ${values.name}, ${values.tagline}, ${values.description},
          ${values.story}, ${values.includes}, ${values.highlights}, ${values.good_to_know},
          ${values.price_adult}, ${values.price_child}, ${values.duration},
          ${values.meeting_point}, ${values.image_url}, ${values.image_alt},
          ${values.seo_title}, ${values.seo_description}, ${values.popular},
          ${values.published}, ${values.sort_order}
        )
        returning id
      `;
      const created = rows[0];

      if (!created) {
        fail(path, "Could not create the tour.");
      }

      await sql`
        insert into public.tour_departures (tour_id, time, capacity)
        values (${created.id}, '09:00', 10), (${created.id}, '11:00', 10)
        on conflict do nothing
      `;
      await audit(user, "created_tour", "tour", created.id, { name, slug });
      revalidatePath("/admin/tours");
      redirect(`/admin/tours/${created.id}?saved=1`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("tours_slug_key")) {
      fail(path, "That slug is already used by another tour.");
    }

    if (error instanceof Error && error.message.includes("tours_slug_format")) {
      fail(path, "The slug can only use lowercase letters, numbers and hyphens.");
    }

    throw error;
  }

  revalidatePath("/admin/tours");
  redirect(`${path}?saved=1`);
}

export async function toggleTourAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = text(form, "id");

  await sql`update public.tours set published = not published, updated_at = now() where id = ${id}`;
  await audit(user, "toggled_tour_visibility", "tour", id);
  revalidatePath("/admin/tours");
  redirect("/admin/tours");
}

export async function duplicateTourAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = text(form, "id");

  const rows = await sql<{ id: string }[]>`
    insert into public.tours (
      slug, name, tagline, description, story, includes, highlights, good_to_know,
      price_adult, price_child, duration, meeting_point, image_url, image_alt,
      seo_title, seo_description, popular, published, sort_order
    )
    select
      slug || '-copy-' || floor(random() * 9000 + 1000)::int, name || ' (copy)', tagline,
      description, story, includes, highlights, good_to_know, price_adult, price_child,
      duration, meeting_point, image_url, image_alt, seo_title, seo_description,
      false, false, sort_order + 1
    from public.tours where id = ${id}
    returning id
  `;
  const copy = rows[0];

  if (copy) {
    await sql`
      insert into public.tour_departures (tour_id, time, capacity, active)
      select ${copy.id}, time, capacity, active from public.tour_departures where tour_id = ${id}
      on conflict do nothing
    `;
    await audit(user, "duplicated_tour", "tour", copy.id, { from: id });
  }

  revalidatePath("/admin/tours");
  redirect(`/admin/tours/${copy?.id ?? id}?duplicated=1`);
}

export async function deleteTourAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = text(form, "id");

  const rows = await sql<{ count: number }[]>`
    select count(*)::int as count from public.bookings where tour_id = ${id}
  `;

  if ((rows[0]?.count ?? 0) > 0) {
    fail("/admin/tours", "This tour has bookings. Hide it instead of deleting it.");
  }

  await sql`delete from public.tours where id = ${id}`;
  await audit(user, "deleted_tour", "tour", id);
  revalidatePath("/admin/tours");
  redirect("/admin/tours");
}

/* -------------------------------------------------------------------------- */
/* Availability                                                                */
/* -------------------------------------------------------------------------- */

export async function saveDeparturesAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const tourId = text(form, "tour_id");
  const rows = lines(form, "slots");

  if (!tourId) {
    fail("/admin/availability", "Choose a tour first.");
  }

  const parsed: { time: string; capacity: number }[] = [];

  for (const row of rows) {
    const [rawTime, rawCapacity] = row.split("=").map((part) => part.trim());
    const time = rawTime ?? "";
    const capacity = Number(rawCapacity ?? "10");

    if (!/^[0-2][0-9]:[0-5][0-9]$/.test(time) || !Number.isFinite(capacity) || capacity < 1) {
      fail("/admin/availability", `Could not read "${row}". Use HH:MM=capacity, for example 09:00=10.`);
    }

    parsed.push({ time, capacity: Math.trunc(capacity) });
  }

  await sql.begin(async (tx) => {
    await tx`delete from public.tour_departures where tour_id = ${tourId}`;

    for (const slot of parsed) {
      await tx`
        insert into public.tour_departures (tour_id, time, capacity)
        values (${tourId}, ${slot.time}, ${slot.capacity})
      `;
    }
  });

  await audit(user, "updated_departures", "tour", tourId, { slots: parsed });
  revalidatePath("/admin/availability");
  redirect(`/admin/availability?tour=${tourId}&saved=1`);
}

export async function addBlockedDateAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const date = text(form, "date");
  const tourId = text(form, "tour_id");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fail("/admin/availability", "Pick a date to block.");
  }

  try {
    await sql`
      insert into public.blocked_dates (date, tour_id, reason)
      values (${date}::date, ${tourId || null}, ${text(form, "reason")})
      on conflict do nothing
    `;
  } catch {
    fail("/admin/availability", "That date is already blocked.");
  }

  await audit(user, "blocked_date", "availability", date, { tourId });
  revalidatePath("/admin/availability");
  redirect("/admin/availability?saved=1");
}

export async function removeBlockedDateAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = text(form, "id");

  await sql`delete from public.blocked_dates where id = ${id}`;
  await audit(user, "unblocked_date", "availability", id);
  revalidatePath("/admin/availability");
  redirect("/admin/availability?saved=1");
}

export async function addSpecialPriceAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const date = text(form, "date");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fail("/admin/availability", "Pick a date for the special price.");
  }

  try {
    await sql`
      insert into public.special_prices (date, tour_id, price_adult, price_child, label)
      values (
        ${date}::date, ${text(form, "tour_id") || null},
        ${number(form, "price_adult")}, ${number(form, "price_child")},
        ${text(form, "label")}
      )
      on conflict do nothing
    `;
  } catch {
    fail("/admin/availability", "That date already has a special price.");
  }

  await audit(user, "special_price", "availability", date);
  revalidatePath("/admin/availability");
  redirect("/admin/availability?saved=1");
}

export async function removeSpecialPriceAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = text(form, "id");

  await sql`delete from public.special_prices where id = ${id}`;
  await audit(user, "removed_special_price", "availability", id);
  revalidatePath("/admin/availability");
  redirect("/admin/availability?saved=1");
}

/* -------------------------------------------------------------------------- */
/* Bookings                                                                    */
/* -------------------------------------------------------------------------- */

async function bookingWithTour(id: string) {
  const rows = await sql<
    {
      id: string;
      code: string;
      tour_id: string;
      tour_name: string;
      booking_date: string;
      departure_time: string;
      adults: number;
      children: number;
      total_amount: number;
      status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
      source: "ONLINE" | "POS" | "WHATSAPP";
      guest_name: string;
      guest_email: string;
      guest_phone: string;
      hotel: string;
      payment_status: "UNPAID" | "PENDING" | "PAID" | "REFUNDED" | "FAILED";
      payment_method: string;
      notes: string;
      internal_notes: string;
      created_by: string | null;
      cancelled_at: string | null;
      cancellation_reason: string;
      created_at: string;
    }[]
  >`
    select b.*, t.name as tour_name
    from public.bookings b
    join public.tours t on t.id = b.tour_id
    where b.id = ${id}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function confirmBookingAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "id");

  await setBookingStatus(id, "CONFIRMED");
  await audit(user, "confirmed_booking", "booking", id);
  revalidatePath(`/admin/bookings/${id}`);
  redirect(`/admin/bookings/${id}?saved=1`);
}

export async function completeBookingAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "id");

  await setBookingStatus(id, "COMPLETED");
  await audit(user, "completed_booking", "booking", id);
  revalidatePath(`/admin/bookings/${id}`);
  redirect(`/admin/bookings/${id}?saved=1`);
}

export async function cancelBookingAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "id");
  const reason = text(form, "reason");
  const booking = await bookingWithTour(id);

  await setBookingStatus(id, "CANCELLED", reason);
  await audit(user, "cancelled_booking", "booking", id, { reason });

  if (booking) {
    await notifyBookingCancelled(
      { ...booking, tour_id: booking.tour_id },
      booking.tour_name,
      reason,
    ).catch(() => {});
  }

  revalidatePath(`/admin/bookings/${id}`);
  redirect(`/admin/bookings/${id}?saved=1`);
}

export async function markPaymentAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "id");
  const status = text(form, "status") as "PAID" | "UNPAID" | "REFUNDED" | "PENDING" | "FAILED";
  const method = text(form, "method");
  const booking = await bookingWithTour(id);

  await setPaymentStatus(id, status, method || undefined);

  if (booking) {
    await sql`
      insert into public.payments (booking_id, provider, method, amount, status, paid_at)
      values (
        ${id}, ${status === "REFUNDED" ? "REFUND" : "MANUAL"}, ${method || booking.payment_method || "cash"},
        ${booking.total_amount}, ${status}, ${status === "PAID" ? new Date() : null}
      )
    `;

    if (status === "PAID") {
      await notifyPaymentReceived(
        { ...booking, payment_status: "PAID" },
        booking.tour_name,
        method || booking.payment_method,
      ).catch(() => {});
    }
  }

  await audit(user, "payment_status", "booking", id, { status, method });
  revalidatePath(`/admin/bookings/${id}`);
  redirect(`/admin/bookings/${id}?saved=1`);
}

export async function rescheduleBookingAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "id");
  const date = text(form, "date");
  const time = text(form, "time");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^[0-2][0-9]:[0-5][0-9]$/.test(time)) {
    fail(`/admin/bookings/${id}`, "Pick a valid date and departure time.");
  }

  await rescheduleBooking(id, date, time);
  await audit(user, "rescheduled_booking", "booking", id, { date, time });
  revalidatePath(`/admin/bookings/${id}`);
  redirect(`/admin/bookings/${id}?saved=1`);
}

export async function saveBookingNotesAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "id");

  await sql`
    update public.bookings
    set internal_notes = ${text(form, "internal_notes")}, updated_at = now()
    where id = ${id}
  `;
  await audit(user, "booking_notes", "booking", id);
  revalidatePath(`/admin/bookings/${id}`);
  redirect(`/admin/bookings/${id}?saved=1`);
}

export async function resendConfirmationAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(form, "id");
  const booking = await bookingWithTour(id);

  if (!booking) {
    fail("/admin/bookings", "Booking not found.");
  }

  await notifyBookingCreated(booking, booking.tour_name);
  await audit(user, "resent_confirmation", "booking", id);
  revalidatePath(`/admin/bookings/${id}`);
  redirect(`/admin/bookings/${id}?saved=1`);
}

/* -------------------------------------------------------------------------- */
/* POS                                                                         */
/* -------------------------------------------------------------------------- */

export async function createPosSaleAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const tourId = text(form, "tour_id");
  const date = text(form, "date");
  const time = text(form, "time");
  const adults = number(form, "adults");
  const children = number(form, "children");
  const method = text(form, "payment_method") || "cash";

  if (!tourId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time) {
    fail("/admin/pos", "Choose a tour, date and departure time.");
  }

  if (adults + children < 1) {
    fail("/admin/pos", "A sale needs at least one guest.");
  }

  let bookingId = "";

  try {
    const booking = await createBooking({
      tourId,
      date,
      time,
      adults,
      children,
      guestName: text(form, "guest_name") || "Walk-in guest",
      guestPhone: text(form, "guest_phone"),
      guestEmail: text(form, "guest_email"),
      hotel: "",
      notes: text(form, "notes"),
      source: "POS",
      createdById: user.id,
      paymentStatus: "PAID",
      paymentMethod: method,
      paymentProvider: "POS",
    });

    bookingId = booking.id;

    const tour = await getTourById(tourId);
    await notifyPaymentReceived(booking, tour?.name ?? "Tour", method).catch(() => {});
  } catch (error) {
    if (error instanceof BookingError) {
      fail("/admin/pos", error.message);
    }

    throw error;
  }

  await audit(user, "pos_sale", "booking", bookingId, { method, adults, children });
  revalidatePath("/admin/bookings");
  redirect(`/admin/bookings/${bookingId}?sale=1`);
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                     */
/* -------------------------------------------------------------------------- */

export async function addGalleryAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const url = text(form, "url");
  const alt = text(form, "alt");

  if (!url || !alt) {
    fail("/admin/gallery", "An image needs a URL and alt text for SEO.");
  }

  await sql`
    insert into public.gallery_images (url, alt, caption, category, sort_order, approved, uploaded_by)
    values (
      ${url}, ${alt}, ${text(form, "caption")}, ${text(form, "category") || "rafting"},
      ${number(form, "sort_order")}, ${user.role === "ADMIN" ? checkbox(form, "approved") : false},
      ${user.id}
    )
  `;
  await audit(user, "added_gallery_image", "gallery", url, { alt });
  revalidatePath("/admin/gallery");
  redirect("/admin/gallery?saved=1");
}

export async function deleteGalleryAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = text(form, "id");

  await sql`delete from public.gallery_images where id = ${id}`;
  await audit(user, "deleted_gallery_image", "gallery", id);
  revalidatePath("/admin/gallery");
  redirect("/admin/gallery?saved=1");
}

export async function approveGalleryAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = text(form, "id");

  await sql`update public.gallery_images set approved = true where id = ${id}`;
  await audit(user, "approved_gallery_image", "gallery", id);
  revalidatePath("/admin/gallery");
  redirect("/admin/gallery?saved=1");
}

/* -------------------------------------------------------------------------- */
/* Staff                                                                       */
/* -------------------------------------------------------------------------- */

export async function createStaffAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const email = text(form, "email").toLowerCase();
  const name = text(form, "name");
  const password = String(form.get("password") ?? "");
  const role = text(form, "role") === "ADMIN" ? "ADMIN" : "STAFF";

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    fail("/admin/staff", "Enter a name and a valid email.");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    fail("/admin/staff", `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const passwordHash = await hashPassword(password);

  try {
    const rows = await sql<{ id: string }[]>`
      insert into public.users (email, name, password_hash, role, active)
      values (${email}, ${name}, ${passwordHash}, ${role}, true)
      returning id
    `;
    const created = rows[0];

    if (created) {
      await audit(user, "created_staff", "user", created.id, { email, role });
    }
  } catch {
    fail("/admin/staff", "That email is already in use.");
  }

  revalidatePath("/admin/staff");
  redirect("/admin/staff?saved=1");
}

export async function toggleStaffAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = text(form, "id");

  if (id === user.id) {
    fail("/admin/staff", "You cannot deactivate your own account.");
  }

  const rows = await sql<{ email: string; active: boolean }[]>`
    update public.users set active = not active, updated_at = now()
    where id = ${id}
    returning email, active
  `;
  await audit(user, "toggled_staff", "user", id, { active: rows[0]?.active });
  revalidatePath("/admin/staff");
  redirect("/admin/staff?saved=1");
}

export async function resetStaffPasswordAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = text(form, "id");
  const password = String(form.get("password") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    fail("/admin/staff", `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const passwordHash = await hashPassword(password);
  await sql`update public.users set password_hash = ${passwordHash}, updated_at = now() where id = ${id}`;
  await audit(user, "reset_staff_password", "user", id);
  revalidatePath("/admin/staff");
  redirect("/admin/staff?saved=1");
}

/* -------------------------------------------------------------------------- */
/* Settings and System                                                         */
/* -------------------------------------------------------------------------- */

export async function saveBusinessSettingsAction(form: FormData): Promise<void> {
  const user = await requireAdmin();

  const business: BusinessSettings = {
    name: text(form, "name"),
    whatsapp: text(form, "whatsapp"),
    email: text(form, "email"),
    address: text(form, "address"),
    hours: text(form, "hours"),
    pickupAreas: text(form, "pickupAreas"),
  };

  if (!business.name) {
    fail("/admin/settings", "The business needs a name.");
  }

  await saveSetting("business", business);
  await audit(user, "updated_settings", "settings", "business");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function savePaymentSettingsAction(form: FormData): Promise<void> {
  const user = await requireAdmin();

  const payments: PaymentSettings = {
    gatewayEnabled: checkbox(form, "gatewayEnabled"),
    provider: "midtrans",
    sandbox: checkbox(form, "sandbox"),
    currency: "IDR",
    depositPercent: Math.min(100, Math.max(0, number(form, "depositPercent"))),
    methods: ["card", "qris", "ewallet", "paypal", "googlepay", "applepay", "cash"],
  };

  await saveSetting("payments", payments);
  await audit(user, "updated_payment_settings", "settings", "payments", payments);
  revalidatePath("/admin/system");
  redirect("/admin/system?saved=1");
}

export async function saveNotificationSettingsAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const current = await getNotificationSettings();

  const notifications: NotificationSettings = {
    sendgridEnabled: checkbox(form, "sendgridEnabled"),
    bookingFrom: text(form, "bookingFrom") || current.bookingFrom,
    cancelFrom: text(form, "cancelFrom") || current.cancelFrom,
    financeFrom: text(form, "financeFrom") || current.financeFrom,
    notifyBooking: checkbox(form, "notifyBooking"),
    notifyCancel: checkbox(form, "notifyCancel"),
    notifyPayment: checkbox(form, "notifyPayment"),
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  for (const address of [
    notifications.bookingFrom,
    notifications.cancelFrom,
    notifications.financeFrom,
  ]) {
    if (!emailPattern.test(address)) {
      fail("/admin/system", "Every sender address must be a valid email.");
    }
  }

  await saveSetting("notifications", notifications);
  await audit(user, "updated_notification_settings", "settings", "notifications");
  revalidatePath("/admin/system");
  redirect("/admin/system?saved=1");
}

export async function testEmailAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const to = text(form, "to");
  const kind = (text(form, "kind") || "booking") as EmailKind;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
    fail("/admin/system", "Enter a valid test recipient.");
  }

  const result = await sendEmail({
    kind,
    to,
    subject: "Test email from the Telaga Waja portal",
    text: `This is a test sent from Admin → System.\n\nKind: ${kind}\nTriggered by: ${user.email}\n\nIf you received it, the sender address and provider key are working.`,
  });

  await audit(user, "test_email", "settings", "email", { ok: result.ok, to });

  if (!result.ok) {
    fail("/admin/system", result.error ?? "The test email could not be sent.");
  }

  revalidatePath("/admin/system");
  redirect("/admin/system?tested=1");
}
