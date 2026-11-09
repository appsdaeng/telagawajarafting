import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { mapTransactionStatus, verifyNotificationSignature } from "@/lib/payments/midtrans";

/**
 * Midtrans HTTP notification.
 *
 * Rejects anything without a valid sha512 signature, then updates the payment row
 * and the booking. Midtrans retries until it gets a 2xx, so every valid
 * notification is answered 200 even when it changes nothing.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body || !verifyNotificationSignature(body as never)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const orderId = String(body.order_id ?? "");
  const mapped = mapTransactionStatus(String(body.transaction_status ?? ""));

  if (!orderId || !mapped) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const paid = mapped.paymentStatus === "PAID";

  await sql`
    update public.payments
    set status = ${mapped.paymentStatus},
        raw = ${sql.json(body as never)},
        paid_at = ${paid ? new Date() : null}
    where provider_ref = ${orderId}
  `;

  await sql`
    update public.bookings
    set payment_status = ${mapped.bookingPaymentStatus},
        status = case
          when ${paid} and status = 'PENDING' then 'CONFIRMED'
          when ${mapped.bookingPaymentStatus === "REFUNDED"} and status <> 'CANCELLED' then 'CANCELLED'
          else status
        end,
        updated_at = now()
    where code = ${orderId}
  `;

  return NextResponse.json({ ok: true });
}
