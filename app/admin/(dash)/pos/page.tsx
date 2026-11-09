import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listTours, slotsFor } from "@/lib/bookings";
import { sql } from "@/lib/db";
import { formatRupiah } from "@/lib/tours";
import {
  Badge,
  Card,
  PageHeader,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  labelClass,
} from "@/app/admin/_components/ui";
import { createPosSaleAction } from "../actions";

export const metadata: Metadata = { title: "POS" };

function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date());
}

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string; date?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { tour, date, error } = await searchParams;
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today();

  const tours = await listTours(false);
  const chosen = tours.find((item) => item.id === tour) ?? tours[0];
  const slots = chosen ? await slotsFor(chosen.id, day) : [];

  const sales = await sql<
    { id: string; code: string; guest_name: string; total_amount: number; payment_method: string; created_at: string; staff: string | null }[]
  >`
    select b.id, b.code, b.guest_name, b.total_amount, b.payment_method,
           b.created_at::text as created_at, u.name as staff
    from public.bookings b
    left join public.users u on u.id = b.created_by
    where b.source = 'POS'
      and b.created_at::date >= (now() at time zone 'Asia/Makassar')::date - 1
      ${user.role === "ADMIN" ? sql`` : sql`and b.created_by = ${user.id}`}
    order by b.created_at desc
    limit 15
  `;

  const cash = sales
    .filter((sale) => sale.payment_method === "cash")
    .reduce((sum, sale) => sum + sale.total_amount, 0);
  const card = sales
    .filter((sale) => ["card", "transfer", "qris", "ewallet"].includes(sale.payment_method))
    .reduce((sum, sale) => sum + sale.total_amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Point of sale"
        description="Record a walk-in sale. Seats are checked against live availability, so online and counter bookings cannot collide."
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {tours.length === 0 ? (
        <Card className="p-6 text-sm text-river-600">
          No published tours yet. An admin needs to publish a tour first.
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <form className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className={labelClass}>Tour</span>
                <select name="tour" defaultValue={chosen?.id} className={inputClass}>
                  {tours.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Date</span>
                <input type="date" name="date" defaultValue={day} className={inputClass} />
              </label>
              <button type="submit" className={buttonSecondary}>
                Load departures
              </button>
            </form>
          </Card>

          {chosen ? (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <Card className="p-4">
                <h2 className="text-sm font-semibold">
                  New sale · {chosen.name} · {day}
                </h2>

                {slots.length === 0 ? (
                  <p className="mt-3 text-sm text-red-700">
                    No departures configured for this tour. Add them in Availability.
                  </p>
                ) : (
                  <form action={createPosSaleAction} className="mt-3 space-y-3">
                    <input type="hidden" name="tour_id" value={chosen.id} />
                    <input type="hidden" name="date" value={day} />

                    <fieldset>
                      <legend className={labelClass}>Departure</legend>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {slots.map((slot) => (
                          <label
                            key={slot.time}
                            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                              slot.remaining === 0
                                ? "border-river-100 bg-river-50 text-river-400"
                                : "border-river-200 bg-white hover:border-river-400"
                            }`}
                          >
                            <input
                              type="radio"
                              name="time"
                              value={slot.time}
                              required
                              disabled={slot.remaining === 0}
                              className="mr-2"
                            />
                            {slot.time}
                            <span className="ml-2 text-xs text-river-500">
                              {slot.remaining === 0 ? "full" : `${slot.remaining} left`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className={labelClass}>Adults</span>
                        <input
                          name="adults"
                          type="number"
                          min="0"
                          max={chosen ? 20 : 0}
                          defaultValue="2"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Children (7–12)</span>
                        <input
                          name="children"
                          type="number"
                          min="0"
                          max="20"
                          defaultValue="0"
                          className={inputClass}
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className={labelClass}>Guest name</span>
                        <input name="guest_name" className={inputClass} placeholder="Walk-in guest" />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Phone</span>
                        <input name="guest_phone" className={inputClass} />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Email (optional)</span>
                        <input name="guest_email" type="email" className={inputClass} />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Payment method</span>
                        <select name="payment_method" className={inputClass} defaultValue="cash">
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="transfer">Bank transfer</option>
                          <option value="qris">QRIS</option>
                          <option value="ewallet">E-wallet</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelClass}>Notes</span>
                        <input name="notes" className={inputClass} />
                      </label>
                    </div>

                    <div className="rounded-lg bg-river-50 px-3 py-2 text-xs text-river-700">
                      Rates today: adult {formatRupiah(chosen.price_adult)}, child{" "}
                      {formatRupiah(chosen.price_child)}. The server applies any special price for
                      this date.
                    </div>

                    <button type="submit" className={buttonPrimary}>
                      Record sale and mark paid
                    </button>
                  </form>
                )}
              </Card>

              <Card className="p-4">
                <h2 className="text-sm font-semibold">
                  Recent POS sales {user.role === "ADMIN" ? "(all staff)" : "(yours)"}
                </h2>
                <div className="mt-2 flex gap-4 text-xs text-river-600">
                  <span>Cash {formatRupiah(cash)}</span>
                  <span>Card/transfer {formatRupiah(card)}</span>
                </div>

                {sales.length === 0 ? (
                  <p className="mt-3 text-sm text-river-500">No POS sales yet.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-river-50 text-sm">
                    {sales.map((sale) => (
                      <li key={sale.id} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <Link
                            href={`/admin/bookings/${sale.id}`}
                            className="font-mono text-xs underline"
                          >
                            {sale.code}
                          </Link>
                          <p className="truncate text-xs text-river-500">
                            {sale.guest_name}
                            {sale.staff ? ` · ${sale.staff}` : ""} · {sale.created_at.slice(11, 16)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{formatRupiah(sale.total_amount)}</p>
                          <Badge tone="slate">{sale.payment_method.toUpperCase()}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export const instant = false;
