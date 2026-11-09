import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { EmailLogRow, PaymentRow } from "@/lib/db-types";
import { formatRupiah } from "@/lib/tours";
import {
  Badge,
  Card,
  PageHeader,
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  labelClass,
  statusTone,
} from "@/app/admin/_components/ui";
import {
  cancelBookingAction,
  completeBookingAction,
  confirmBookingAction,
  markPaymentAction,
  resendConfirmationAction,
  rescheduleBookingAction,
  saveBookingNotesAction,
} from "../../actions";

export const metadata: Metadata = { title: "Booking" };

type Detail = {
  id: string;
  code: string;
  tour_name: string;
  tour_slug: string;
  booking_date: string;
  departure_time: string;
  adults: number;
  children: number;
  total_amount: number;
  status: string;
  source: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  hotel: string;
  notes: string;
  internal_notes: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  cancelled_at: string | null;
  cancellation_reason: string;
};

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; sale?: string; error?: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const { saved, sale, error } = await searchParams;

  const rows = await sql<Detail[]>`
    select b.id, b.code, t.name as tour_name, t.slug as tour_slug,
           b.booking_date::text as booking_date, b.departure_time, b.adults, b.children,
           b.total_amount, b.status, b.source, b.guest_name, b.guest_email, b.guest_phone,
           b.hotel, b.notes, b.internal_notes, b.payment_status, b.payment_method,
           b.created_at::text as created_at, b.cancelled_at::text as cancelled_at,
           b.cancellation_reason
    from public.bookings b
    join public.tours t on t.id = b.tour_id
    where b.id = ${id}
    limit 1
  `;
  const booking = rows[0];

  if (!booking) {
    notFound();
  }

  const payments = await sql<PaymentRow[]>`
    select * from public.payments where booking_id = ${id} order by created_at desc
  `;
  const emails = await sql<EmailLogRow[]>`
    select * from public.email_log where booking_id = ${id} order by created_at desc limit 10
  `;

  return (
    <div className="space-y-5">
      <PageHeader
        title={booking.code}
        description={`${booking.tour_name} · ${booking.booking_date} at ${booking.departure_time}`}
        actions={
          <Link href="/admin/bookings" className={buttonSecondary}>
            All bookings
          </Link>
        }
      />

      {sale ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Sale recorded and paid. Give the guest the code above.
        </p>
      ) : null}

      {saved ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Saved.</p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(booking.status)}>{booking.status}</Badge>
            <Badge tone={statusTone(booking.payment_status)}>{booking.payment_status}</Badge>
            <Badge tone={booking.source === "POS" ? "slate" : "river"}>{booking.source}</Badge>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-river-500">Guest</dt>
              <dd className="font-medium">{booking.guest_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">Party</dt>
              <dd>
                {booking.adults} adult{booking.adults === 1 ? "" : "s"}
                {booking.children ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">Phone</dt>
              <dd>{booking.guest_phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">Email</dt>
              <dd className="break-all">{booking.guest_email || "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-river-500">Hotel / meeting point</dt>
              <dd>{booking.hotel || "Base camp (no pickup)"}</dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">Total</dt>
              <dd className="text-base font-semibold">{formatRupiah(booking.total_amount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">Payment method</dt>
              <dd className="uppercase">{booking.payment_method || "—"}</dd>
            </div>
            {booking.notes ? (
              <div className="col-span-2">
                <dt className="text-xs text-river-500">Guest notes</dt>
                <dd className="whitespace-pre-wrap">{booking.notes}</dd>
              </div>
            ) : null}
            {booking.status === "CANCELLED" ? (
              <div className="col-span-2">
                <dt className="text-xs text-river-500">Cancellation</dt>
                <dd>
                  {booking.cancellation_reason || "no reason given"}
                  {booking.cancelled_at ? ` · ${booking.cancelled_at.slice(0, 16)}` : ""}
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Status</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {booking.status === "PENDING" ? (
                <form action={confirmBookingAction}>
                  <input type="hidden" name="id" value={booking.id} />
                  <button type="submit" className={buttonPrimary}>
                    Confirm booking
                  </button>
                </form>
              ) : null}

              {booking.status === "CONFIRMED" ? (
                <form action={completeBookingAction}>
                  <input type="hidden" name="id" value={booking.id} />
                  <button type="submit" className={buttonSecondary}>
                    Mark completed
                  </button>
                </form>
              ) : null}

              <form action={resendConfirmationAction}>
                <input type="hidden" name="id" value={booking.id} />
                <button type="submit" className={buttonSecondary}>
                  Resend confirmation
                </button>
              </form>
            </div>

            {booking.status !== "CANCELLED" ? (
              <form action={cancelBookingAction} className="mt-4 border-t border-river-100 pt-3">
                <input type="hidden" name="id" value={booking.id} />
                <label className="block">
                  <span className={labelClass}>Cancellation reason</span>
                  <input name="reason" className={inputClass} placeholder="Weather, guest request…" />
                </label>
                <button type="submit" className={`mt-2 ${buttonDanger}`}>
                  Cancel booking
                </button>
              </form>
            ) : null}
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold">Payment</h2>
            <form action={markPaymentAction} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={booking.id} />
              <label className="block">
                <span className={labelClass}>Record status</span>
                <select name="status" defaultValue="PAID" className={inputClass}>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Method</span>
                <select name="method" defaultValue={booking.payment_method || "cash"} className={inputClass}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Bank transfer</option>
                  <option value="qris">QRIS</option>
                  <option value="ewallet">E-wallet</option>
                  <option value="paypal">PayPal</option>
                </select>
              </label>
              <button type="submit" className={buttonPrimary}>
                Record payment
              </button>
            </form>

            {user.role === "ADMIN" && payments.length > 0 ? (
              <ul className="mt-4 space-y-1 border-t border-river-100 pt-3 text-xs text-river-600">
                {payments.map((payment) => (
                  <li key={payment.id}>
                    {payment.created_at.slice(0, 16)} · {payment.provider} ·{" "}
                    {payment.method || "—"} · {formatRupiah(payment.amount)} ·{" "}
                    <span className="font-medium uppercase">{payment.status}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold">Reschedule</h2>
            <form action={rescheduleBookingAction} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={booking.id} />
              <label className="block">
                <span className={labelClass}>Date</span>
                <input
                  type="date"
                  name="date"
                  defaultValue={booking.booking_date}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Time</span>
                <input
                  type="time"
                  name="time"
                  defaultValue={booking.departure_time}
                  className={inputClass}
                />
              </label>
              <button type="submit" className={buttonSecondary}>
                Move
              </button>
            </form>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Internal notes</h2>
          <form action={saveBookingNotesAction} className="mt-2">
            <input type="hidden" name="id" value={booking.id} />
            <textarea
              name="internal_notes"
              rows={4}
              defaultValue={booking.internal_notes}
              className={inputClass}
              placeholder="Not shown to the guest"
            />
            <button type="submit" className={`mt-2 ${buttonSecondary}`}>
              Save notes
            </button>
          </form>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold">Emails for this booking</h2>
          {emails.length === 0 ? (
            <p className="mt-2 text-sm text-river-500">
              No email sent yet. Confirmations go to the guest and the booking inbox once a
              provider key is set.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-river-600">
              {emails.map((email) => (
                <li key={email.id}>
                  {email.created_at.slice(0, 16)} · {email.kind} · {email.to_email} ·{" "}
                  <span className="font-medium uppercase">{email.status}</span>
                  {email.error ? ` · ${email.error}` : ""}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export const instant = false;
