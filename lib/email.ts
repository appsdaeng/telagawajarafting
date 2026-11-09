import { sql } from "@/lib/db";
import { formatRupiah } from "@/lib/tours";
import { getBusiness, getNotificationSettings } from "@/lib/settings";
import type { BookingRow } from "@/lib/db-types";

/**
 * Transactional email.
 *
 * Resend is the primary provider (one POST, no SDK); SendGrid stays supported as
 * a fallback so an existing key keeps working. Without a key the message is still
 * written to `email_log` with status `skipped`, which makes the System tab's
 * "recent attempts" table honest instead of silent.
 *
 * Three outbound identities, each configurable in Admin → System:
 *   booking@   new bookings
 *   cancel@    cancellations
 *   finance@   payments received
 */
export type EmailKind = "booking" | "cancellation" | "payment" | "custom";

type SendInput = {
  kind: EmailKind;
  to: string;
  subject: string;
  text: string;
  bookingId?: string | null;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

export const emailConfigured =
  (process.env.RESEND_API_KEY ?? "").trim().length > 0 ||
  (process.env.SENDGRID_API_KEY ?? "").trim().length > 0;

async function fromAddress(kind: EmailKind): Promise<string> {
  const settings = await getNotificationSettings();

  if (kind === "cancellation") {
    return settings.cancelFrom || process.env.SENDGRID_CANCEL_FROM || "cancel@telagawajarafting.com";
  }

  if (kind === "payment") {
    return settings.financeFrom || process.env.SENDGRID_FINANCE_FROM || "finance@telagawajarafting.com";
  }

  return settings.bookingFrom || process.env.SENDGRID_BOOKING_FROM || "booking@telagawajarafting.com";
}

function htmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function textToHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px">${htmlEscape(block).replaceAll("\n", "<br />")}</p>`)
    .join("");

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#08262b">${paragraphs}</div>`;
}

async function logEmail(input: {
  kind: EmailKind;
  to: string;
  from: string;
  subject: string;
  status: string;
  providerId?: string;
  error?: string;
  bookingId?: string | null;
}): Promise<void> {
  try {
    await sql`
      insert into public.email_log (kind, to_email, from_email, subject, status, provider_id, error, booking_id)
      values (
        ${input.kind}, ${input.to}, ${input.from}, ${input.subject},
        ${input.status}, ${input.providerId ?? ""}, ${input.error ?? ""},
        ${input.bookingId ?? null}
      )
    `;
  } catch {
    /* logging must not break the send */
  }
}

export async function sendEmail(input: SendInput): Promise<{ ok: boolean; error?: string }> {
  const from = await fromAddress(input.kind);
  const resendKey = (process.env.RESEND_API_KEY ?? "").trim();
  const sendgridKey = (process.env.SENDGRID_API_KEY ?? "").trim();

  if (!input.to) {
    await logEmail({ ...input, from, status: "skipped", error: "No recipient" });
    return { ok: false, error: "No recipient address." };
  }

  if (!resendKey && !sendgridKey) {
    await logEmail({ ...input, from, status: "skipped", error: "No email provider key set" });
    return { ok: false, error: "Set RESEND_API_KEY (or SENDGRID_API_KEY) in Vercel." };
  }

  try {
    if (resendKey) {
      const response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          text: input.text,
          html: textToHtml(input.text),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };

      if (!response.ok) {
        const error = body.message ?? `Resend returned ${response.status}`;
        await logEmail({ ...input, from, status: "failed", error });
        return { ok: false, error };
      }

      await logEmail({ ...input, from, status: "sent", providerId: body.id ?? "" });
      return { ok: true };
    }

    const response = await fetch(SENDGRID_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.to }] }],
        from: { email: from },
        subject: input.subject,
        content: [
          { type: "text/plain", value: input.text },
          { type: "text/html", value: textToHtml(input.text) },
        ],
      }),
    });

    if (!response.ok) {
      const error = `SendGrid returned ${response.status}: ${(await response.text()).slice(0, 300)}`;
      await logEmail({ ...input, from, status: "failed", error });
      return { ok: false, error };
    }

    await logEmail({
      ...input,
      from,
      status: "sent",
      providerId: response.headers.get("x-message-id") ?? "",
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    await logEmail({ ...input, from, status: "failed", error: message });
    return { ok: false, error: message };
  }
}

function bookingLines(booking: BookingRow, tourName: string): string {
  return [
    `Booking code: ${booking.code}`,
    `Tour: ${tourName}`,
    `Date: ${booking.booking_date} at ${booking.departure_time}`,
    `Guests: ${booking.adults} adult(s), ${booking.children} child(ren)`,
    `Total: ${formatRupiah(booking.total_amount)}`,
    `Guest: ${booking.guest_name}`,
    booking.guest_phone ? `Phone: ${booking.guest_phone}` : "",
    booking.guest_email ? `Email: ${booking.guest_email}` : "",
    booking.hotel ? `Hotel pickup: ${booking.hotel}` : "Meeting point: base camp",
    booking.notes ? `Notes: ${booking.notes}` : "",
    `Source: ${booking.source}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Internal alert + guest confirmation for a new booking. */
export async function notifyBookingCreated(booking: BookingRow, tourName: string): Promise<void> {
  const settings = await getNotificationSettings();

  if (!settings.notifyBooking) {
    return;
  }

  const business = await getBusiness();
  const lines = bookingLines(booking, tourName);

  await sendEmail({
    kind: "booking",
    to: settings.bookingFrom || business.email,
    subject: `New booking ${booking.code} — ${booking.booking_date} ${booking.departure_time}`,
    text: `A new booking came in.\n\n${lines}\n\nReply to the guest on WhatsApp if anything is unclear.`,
    bookingId: booking.id,
  });

  if (booking.guest_email) {
    await sendEmail({
      kind: "booking",
      to: booking.guest_email,
      subject: `Your Telaga Waja booking ${booking.code}`,
      text: `Thank you — we have your booking request.\n\n${lines}\n\nWe confirm every departure by hand. If you have not heard from us within a few hours, message us on WhatsApp.\n\n${business.name}\n${business.address}\n${business.hours}`,
      bookingId: booking.id,
    });
  }
}

export async function notifyBookingCancelled(
  booking: BookingRow,
  tourName: string,
  reason: string,
): Promise<void> {
  const settings = await getNotificationSettings();

  if (!settings.notifyCancel) {
    return;
  }

  const business = await getBusiness();
  const lines = bookingLines(booking, tourName);

  await sendEmail({
    kind: "cancellation",
    to: settings.cancelFrom || business.email,
    subject: `Cancelled ${booking.code} — ${booking.booking_date} ${booking.departure_time}`,
    text: `A booking was cancelled.\n\n${lines}\n\nReason: ${reason || "not given"}`,
    bookingId: booking.id,
  });

  if (booking.guest_email) {
    await sendEmail({
      kind: "cancellation",
      to: booking.guest_email,
      subject: `Your Telaga Waja booking ${booking.code} was cancelled`,
      text: `Your booking has been cancelled.\n\n${lines}\n\nReason: ${reason || "not given"}\n\nIf this was not expected, reply to this email or message us on WhatsApp.\n\n${business.name}`,
      bookingId: booking.id,
    });
  }
}

export async function notifyPaymentReceived(
  booking: BookingRow,
  tourName: string,
  method: string,
): Promise<void> {
  const settings = await getNotificationSettings();

  if (!settings.notifyPayment) {
    return;
  }

  const business = await getBusiness();

  await sendEmail({
    kind: "payment",
    to: settings.financeFrom || business.email,
    subject: `Payment received ${booking.code} — ${formatRupiah(booking.total_amount)}`,
    text: `A payment was recorded.\n\n${bookingLines(booking, tourName)}\nMethod: ${method || booking.payment_method || "not stated"}\nStatus: ${booking.payment_status}`,
    bookingId: booking.id,
  });
}
