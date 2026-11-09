import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatRupiah } from "@/lib/tours";
import {
  Badge,
  Card,
  Empty,
  PageHeader,
  Stat,
  buttonSecondary,
  statusTone,
} from "@/app/admin/_components/ui";

export const metadata: Metadata = { title: "Payments" };

type MethodRow = { method: string; count: number; total: number };
type DayRow = { day: string; total: number; bookings: number };
type PaymentListRow = {
  id: string;
  booking_id: string;
  code: string;
  guest_name: string;
  tour_name: string;
  provider: string;
  method: string;
  amount: number;
  status: string;
  created_at: string;
};
type StaffRow = { staff: string | null; cash: number; sales: number };

export default async function PaymentsPage() {
  await requireAdmin();

  const methods = await sql<MethodRow[]>`
    select coalesce(nullif(p.method, ''), 'unspecified') as method,
           count(*)::int as count, coalesce(sum(p.amount), 0)::int as total
    from public.payments p
    where p.status = 'PAID' and p.created_at >= now() - interval '30 days'
    group by 1
    order by total desc
  `;

  const days = await sql<DayRow[]>`
    select b.booking_date::text as day,
           coalesce(sum(b.total_amount), 0)::int as total,
           count(*)::int as bookings
    from public.bookings b
    where b.status <> 'CANCELLED'
      and b.booking_date >= (now() at time zone 'Asia/Makassar')::date - 13
      and b.booking_date <= (now() at time zone 'Asia/Makassar')::date + 7
    group by 1
    order by 1
  `;

  const [totals] = await sql<{ paid: number; pending: number; refunded: number }[]>`
    select
      coalesce(sum(amount) filter (where status = 'PAID'), 0)::int as paid,
      coalesce(sum(amount) filter (where status = 'PENDING'), 0)::int as pending,
      coalesce(sum(amount) filter (where status = 'REFUNDED'), 0)::int as refunded
    from public.payments
    where created_at >= now() - interval '30 days'
  `;

  const list = await sql<PaymentListRow[]>`
    select p.id, p.booking_id, b.code, b.guest_name, t.name as tour_name, p.provider,
           p.method, p.amount, p.status, p.created_at::text as created_at
    from public.payments p
    join public.bookings b on b.id = p.booking_id
    join public.tours t on t.id = b.tour_id
    order by p.created_at desc
    limit 50
  `;

  const staff = await sql<StaffRow[]>`
    select u.name as staff,
           coalesce(sum(b.total_amount) filter (where b.payment_method = 'cash'), 0)::int as cash,
           count(*)::int as sales
    from public.bookings b
    left join public.users u on u.id = b.created_by
    where b.source = 'POS'
      and b.booking_date = (now() at time zone 'Asia/Makassar')::date
    group by 1
    order by cash desc
  `;

  const maxDay = Math.max(1, ...days.map((day) => day.total));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments and finance"
        description="Last 30 days of gateway and counter payments, and the daily close per staff member."
        actions={
          <Link href="/admin/bookings/export" className={buttonSecondary}>
            Export bookings
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Paid, 30 days" value={formatRupiah(totals?.paid ?? 0)} />
        <Stat label="Pending" value={formatRupiah(totals?.pending ?? 0)} />
        <Stat label="Refunded" value={formatRupiah(totals?.refunded ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">By payment method (30 days)</h2>
          {methods.length === 0 ? (
            <p className="mt-2 text-sm text-river-500">No payments recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {methods.map((method) => (
                <li key={method.method} className="flex items-center justify-between gap-2">
                  <span className="uppercase">{method.method}</span>
                  <span className="text-river-600">
                    {method.count} × · <strong>{formatRupiah(method.total)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold">Daily close today (POS)</h2>
          {staff.length === 0 ? (
            <p className="mt-2 text-sm text-river-500">No POS sales today.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {staff.map((row) => (
                <li key={row.staff ?? "unknown"} className="flex items-center justify-between">
                  <span>{row.staff ?? "Unknown"}</span>
                  <span className="text-river-600">
                    {row.sales} sale{row.sales === 1 ? "" : "s"} · cash{" "}
                    <strong>{formatRupiah(row.cash)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-river-500">
            Card and transfer totals per staff member are in the POS list.
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold">Booked value by date</h2>
        <div className="mt-3 space-y-1">
          {days.map((day) => (
            <div key={day.day} className="flex items-center gap-3 text-xs">
              <span className="w-24 shrink-0 text-river-600">{day.day}</span>
              <div className="h-2 flex-1 rounded-full bg-river-50">
                <div
                  className="h-2 rounded-full bg-river-500"
                  style={{ width: `${Math.round((day.total / maxDay) * 100)}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right">{formatRupiah(day.total)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-0">
        <h2 className="border-b border-river-100 px-4 py-3 text-sm font-semibold">
          Latest transactions
        </h2>
        {list.length === 0 ? (
          <Empty>No payment records yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-river-50/60 text-xs text-river-600 uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Booking</th>
                  <th className="px-4 py-2 font-medium">Guest</th>
                  <th className="px-4 py-2 font-medium">Method</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-river-50">
                {list.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-2 text-xs text-river-600">
                      {payment.created_at.slice(0, 16)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      <Link href={`/admin/bookings/${payment.booking_id}`} className="underline">
                        {payment.code}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {payment.guest_name}
                      <span className="block text-xs text-river-500">{payment.tour_name}</span>
                    </td>
                    <td className="px-4 py-2 text-xs uppercase">
                      {payment.provider} · {payment.method || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Badge tone={statusTone(payment.status)}>{payment.status}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right">{formatRupiah(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export const instant = false;
