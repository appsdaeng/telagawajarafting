import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { BookingWithTour } from "@/lib/db-types";
import { formatRupiah } from "@/lib/tours";
import {
  Badge,
  Card,
  Empty,
  PageHeader,
  buttonPrimary,
  inputClass,
  labelClass,
  statusTone,
} from "@/app/admin/_components/ui";

export const metadata: Metadata = { title: "Bookings" };

type Filters = {
  date?: string;
  status?: string;
  source?: string;
  q?: string;
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  await requireAdmin();
  const { date, status, source, q } = await searchParams;

  const filters = [sql`true`];

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    filters.push(sql`b.booking_date = ${date}::date`);
  }

  if (status && ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
    filters.push(sql`b.status = ${status}`);
  }

  if (source && ["ONLINE", "POS", "WHATSAPP"].includes(source)) {
    filters.push(sql`b.source = ${source}`);
  }

  if (q) {
    const term = `%${q}%`;
    filters.push(sql`(
      b.code ilike ${term} or b.guest_name ilike ${term} or
      b.guest_email ilike ${term} or b.guest_phone ilike ${term} or
      b.hotel ilike ${term}
    )`);
  }

  const where = filters.reduce((accumulator, filter) => sql`${accumulator} and ${filter}`);

  const bookings = await sql<BookingWithTour[]>`
    select b.*, t.name as tour_name, t.slug as tour_slug
    from public.bookings b
    join public.tours t on t.id = b.tour_id
    where ${where}
    order by b.booking_date desc, b.created_at desc
    limit 200
  `;

  const query = new URLSearchParams(
    Object.entries({ date, status, source, q }).filter(([, value]) => Boolean(value)) as [
      string,
      string,
    ][],
  ).toString();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bookings"
        description="Every online booking, WhatsApp request and POS sale in one list."
        actions={
          <Link
            href={`/admin/bookings/export${query ? `?${query}` : ""}`}
            className={buttonPrimary}
          >
            Export CSV
          </Link>
        }
      />

      <Card className="p-4">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className={labelClass}>Date</span>
            <input type="date" name="date" defaultValue={date} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Status</span>
            <select name="status" defaultValue={status ?? ""} className={inputClass}>
              <option value="">Any</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Source</span>
            <select name="source" defaultValue={source ?? ""} className={inputClass}>
              <option value="">Any</option>
              <option value="ONLINE">Online</option>
              <option value="POS">POS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </label>
          <label className="block lg:col-span-2">
            <span className={labelClass}>Search</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Code, guest, phone, hotel"
              className={inputClass}
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-5">
            <button type="submit" className={buttonPrimary}>
              Apply filters
            </button>
            <Link href="/admin/bookings" className="ml-3 text-xs text-river-600 underline">
              Clear
            </Link>
          </div>
        </form>
      </Card>

      {bookings.length === 0 ? (
        <Empty>No bookings match those filters.</Empty>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-river-50/60 text-xs text-river-600 uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Guest</th>
                  <th className="px-4 py-2 font-medium">Trip</th>
                  <th className="px-4 py-2 font-medium">Party</th>
                  <th className="px-4 py-2 font-medium">Source</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-river-50">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/admin/bookings/${booking.id}`} className="underline">
                        {booking.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{booking.guest_name}</p>
                      <p className="text-xs text-river-500">
                        {booking.guest_phone || booking.guest_email || "no contact"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-river-600">
                      {booking.tour_name}
                      <br />
                      {booking.booking_date} · {booking.departure_time}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {booking.adults}A{booking.children ? ` + ${booking.children}C` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={booking.source === "POS" ? "slate" : "river"}>
                        {booking.source}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={statusTone(booking.status)}>{booking.status}</Badge>
                        <Badge tone={statusTone(booking.payment_status)}>
                          {booking.payment_status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatRupiah(booking.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export const instant = false;
