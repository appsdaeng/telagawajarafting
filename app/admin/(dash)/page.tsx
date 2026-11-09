import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatRupiah } from "@/lib/tours";
import { Badge, Card, Empty, PageHeader, Stat, statusTone } from "@/app/admin/_components/ui";

export const metadata: Metadata = { title: "Overview" };

const TODAY = sql`(now() at time zone 'Asia/Makassar')::date`;

type TodayRow = {
  bookings: number;
  guests: number;
  paid_revenue: number;
  booked_value: number;
  cancelled: number;
};

type PeriodRow = {
  bookings: number;
  value: number;
  paid: number;
  online: number;
  pos: number;
};

type UpcomingRow = {
  day: string;
  departure_time: string;
  name: string;
  bookings: number;
  guests: number;
  capacity: number | null;
};

type RecentRow = {
  id: string;
  code: string;
  guest_name: string;
  booking_date: string;
  departure_time: string;
  tour_name: string;
  status: string;
  payment_status: string;
  total_amount: number;
};

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/admin/pos");
  }

  const { denied } = await searchParams;

  const [today] = await sql<TodayRow[]>`
    select
      count(*) filter (where status <> 'CANCELLED')::int as bookings,
      coalesce(sum(adults + children) filter (where status <> 'CANCELLED'), 0)::int as guests,
      coalesce(sum(total_amount) filter (where status <> 'CANCELLED' and payment_status = 'PAID'), 0)::int as paid_revenue,
      coalesce(sum(total_amount) filter (where status <> 'CANCELLED'), 0)::int as booked_value,
      count(*) filter (where status = 'CANCELLED')::int as cancelled
    from public.bookings
    where booking_date = ${TODAY}
  `;

  const [week] = await sql<PeriodRow[]>`
    select
      count(*)::int as bookings,
      coalesce(sum(total_amount), 0)::int as value,
      coalesce(sum(total_amount) filter (where payment_status = 'PAID'), 0)::int as paid,
      count(*) filter (where source = 'ONLINE')::int as online,
      count(*) filter (where source = 'POS')::int as pos
    from public.bookings
    where status <> 'CANCELLED'
      and booking_date between ${TODAY} - 6 and ${TODAY}
  `;

  const [month] = await sql<PeriodRow[]>`
    select
      count(*)::int as bookings,
      coalesce(sum(total_amount), 0)::int as value,
      coalesce(sum(total_amount) filter (where payment_status = 'PAID'), 0)::int as paid,
      count(*) filter (where source = 'ONLINE')::int as online,
      count(*) filter (where source = 'POS')::int as pos
    from public.bookings
    where status <> 'CANCELLED'
      and booking_date >= date_trunc('month', ${TODAY})::date
      and booking_date < (date_trunc('month', ${TODAY}) + interval '1 month')::date
  `;

  const upcoming = await sql<UpcomingRow[]>`
    select
      b.booking_date::text as day,
      b.departure_time,
      t.name,
      count(*)::int as bookings,
      coalesce(sum(b.adults + b.children), 0)::int as guests,
      max(d.capacity)::int as capacity
    from public.bookings b
    join public.tours t on t.id = b.tour_id
    left join public.tour_departures d
      on d.tour_id = b.tour_id and d.time = b.departure_time
    where b.status <> 'CANCELLED'
      and b.booking_date between ${TODAY} and ${TODAY} + 7
    group by 1, 2, 3
    order by 1, 2
  `;

  const [pending] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from public.bookings
    where status <> 'CANCELLED'
      and payment_status in ('UNPAID', 'PENDING')
      and booking_date >= ${TODAY}
  `;

  const recent = await sql<RecentRow[]>`
    select b.id, b.code, b.guest_name, b.booking_date::text as booking_date,
           b.departure_time, t.name as tour_name, b.status, b.payment_status,
           b.total_amount
    from public.bookings b
    join public.tours t on t.id = b.tour_id
    order by b.created_at desc
    limit 8
  `;

  const almostFull = upcoming.filter(
    (slot) => slot.capacity !== null && slot.capacity - slot.guests <= 2,
  );

  const money = (value: number) => formatRupiah(value || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today at a glance"
        description={`Bookings for ${new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "Asia/Makassar",
        })}`}
      />

      {denied ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That page is admin-only. You are signed in as staff.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Bookings today"
          value={String(today?.bookings ?? 0)}
          hint={`${today?.cancelled ?? 0} cancelled`}
        />
        <Stat label="Guests expected" value={String(today?.guests ?? 0)} />
        <Stat
          label="Revenue today"
          value={money(today?.paid_revenue ?? 0)}
          hint={`${money(today?.booked_value ?? 0)} booked value`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">This week</h2>
            <Link href="/admin/payments" className="text-xs text-river-600 underline">
              Reports
            </Link>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-river-500">Bookings</dt>
              <dd className="font-semibold">{week?.bookings ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">Paid revenue</dt>
              <dd className="font-semibold">{money(week?.paid ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">Online</dt>
              <dd className="font-semibold">{week?.online ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">POS / WhatsApp</dt>
              <dd className="font-semibold">{week?.pos ?? 0}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold">This month</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-river-500">Bookings</dt>
              <dd className="font-semibold">{month?.bookings ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">Paid revenue</dt>
              <dd className="font-semibold">{money(month?.paid ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">Online</dt>
              <dd className="font-semibold">{month?.online ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-river-500">POS / WhatsApp</dt>
              <dd className="font-semibold">{month?.pos ?? 0}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-river-100 px-4 py-3">
            <h2 className="text-sm font-semibold">Next 7 days</h2>
            <Link href="/admin/bookings" className="text-xs text-river-600 underline">
              All bookings
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-river-500">
              No bookings in the next week yet.
            </p>
          ) : (
            <ul className="divide-y divide-river-50">
              {upcoming.map((slot) => {
                const remaining = slot.capacity === null ? null : slot.capacity - slot.guests;
                return (
                  <li
                    key={`${slot.day}-${slot.departure_time}-${slot.name}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {slot.day} · {slot.departure_time}
                      </p>
                      <p className="text-xs text-river-500">{slot.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-river-600">
                        {slot.guests} guest{slot.guests === 1 ? "" : "s"} · {slot.bookings} booking
                        {slot.bookings === 1 ? "" : "s"}
                      </span>
                      {remaining !== null ? (
                        <Badge tone={remaining <= 0 ? "red" : remaining <= 2 ? "amber" : "green"}>
                          {remaining <= 0 ? "Full" : `${remaining} left`}
                        </Badge>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold">Alerts</h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex items-start justify-between gap-2">
              <span>Pending payments</span>
              <Badge tone={(pending?.count ?? 0) > 0 ? "amber" : "green"}>
                {pending?.count ?? 0}
              </Badge>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>Slots almost full (next 7 days)</span>
              <Badge tone={almostFull.length > 0 ? "amber" : "green"}>{almostFull.length}</Badge>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>Cancellations today</span>
              <Badge tone={(today?.cancelled ?? 0) > 0 ? "red" : "green"}>
                {today?.cancelled ?? 0}
              </Badge>
            </li>
          </ul>
          <Link
            href="/admin/availability"
            className="mt-4 inline-block text-xs font-medium text-river-700 underline"
          >
            Manage availability
          </Link>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-river-100 px-4 py-3">
          <h2 className="text-sm font-semibold">Latest bookings</h2>
          <Link href="/admin/bookings" className="text-xs text-river-600 underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <Empty>No bookings yet. Online bookings and POS sales appear here.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-river-50/60 text-xs text-river-600 uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Guest</th>
                  <th className="px-4 py-2 font-medium">Trip</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-river-50">
                {recent.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-2 font-mono text-xs">
                      <Link href={`/admin/bookings/${booking.id}`} className="underline">
                        {booking.code}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{booking.guest_name}</td>
                    <td className="px-4 py-2 text-xs text-river-600">
                      {booking.booking_date} · {booking.departure_time}
                      <br />
                      {booking.tour_name}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={statusTone(booking.status)}>{booking.status}</Badge>
                        <Badge tone={statusTone(booking.payment_status)}>
                          {booking.payment_status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatRupiah(booking.total_amount)}
                    </td>
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
