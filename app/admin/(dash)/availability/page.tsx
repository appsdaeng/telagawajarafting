import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listTours } from "@/lib/bookings";
import { sql } from "@/lib/db";
import type { DepartureRow } from "@/lib/db-types";
import { formatRupiah } from "@/lib/tours";
import {
  Card,
  PageHeader,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  labelClass,
} from "@/app/admin/_components/ui";
import {
  addBlockedDateAction,
  addSpecialPriceAction,
  removeBlockedDateAction,
  removeSpecialPriceAction,
  saveDeparturesAction,
} from "../actions";

export const metadata: Metadata = { title: "Availability" };

type Blocked = { id: string; date: string; reason: string; tour_name: string | null };
type Special = {
  id: string;
  date: string;
  label: string;
  price_adult: number;
  price_child: number;
  tour_name: string | null;
};

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string; saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const { tour, saved, error } = await searchParams;
  const tours = await listTours(true);

  if (tours.length === 0) {
    return (
      <Card className="p-6 text-sm text-river-600">
        Create a tour first, then set its departures here.
      </Card>
    );
  }

  const chosen = tours.find((item) => item.id === tour) ?? tours[0];
  const departures = await sql<DepartureRow[]>`
    select * from public.tour_departures where tour_id = ${chosen.id} order by time
  `;
  const blocked = await sql<Blocked[]>`
    select bd.id, bd.date::text as date, bd.reason, t.name as tour_name
    from public.blocked_dates bd
    left join public.tours t on t.id = bd.tour_id
    where bd.date >= current_date - 1
    order by bd.date
    limit 25
  `;
  const specials = await sql<Special[]>`
    select sp.id, sp.date::text as date, sp.label, sp.price_adult, sp.price_child,
           t.name as tour_name
    from public.special_prices sp
    left join public.tours t on t.id = sp.tour_id
    where sp.date >= current_date - 1
    order by sp.date
    limit 25
  `;

  const slotText = departures.map((slot) => `${slot.time}=${slot.capacity}`).join("\n");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Availability"
        description="Departure times, seats per slot, blocked dates and peak-day prices. Bookings subtract from these automatically."
      />

      {saved ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Saved.</p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className={labelClass}>Tour</span>
            <select name="tour" defaultValue={chosen.id} className={inputClass}>
              {tours.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonSecondary}>
            Switch tour
          </button>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Departures · {chosen.name}</h2>
          <p className="mt-1 text-xs text-river-500">
            One slot per line as <code>HH:MM=seats</code>. Saving replaces the whole schedule for
            this tour.
          </p>
          <form action={saveDeparturesAction} className="mt-3">
            <input type="hidden" name="tour_id" value={chosen.id} />
            <textarea
              name="slots"
              rows={5}
              defaultValue={slotText || "09:00=10\n11:00=10\n13:00=10"}
              className={`${inputClass} font-mono`}
            />
            <button type="submit" className={`mt-2 ${buttonPrimary}`}>
              Save schedule
            </button>
          </form>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold">Block a date</h2>
          <p className="mt-1 text-xs text-river-500">
            Holiday, bad weather, maintenance or a private group. Leave the tour empty to close
            every tour that day.
          </p>
          <form action={addBlockedDateAction} className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Date</span>
              <input type="date" name="date" required className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Tour (optional)</span>
              <select name="tour_id" className={inputClass} defaultValue="">
                <option value="">All tours</option>
                {tours.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Reason</span>
              <input name="reason" className={inputClass} placeholder="Nyepi, river clean-up…" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className={buttonPrimary}>
                Block date
              </button>
            </div>
          </form>

          {blocked.length > 0 ? (
            <ul className="mt-4 divide-y divide-river-50 text-sm">
              {blocked.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    {row.date} · {row.tour_name ?? "All tours"}
                    {row.reason ? ` · ${row.reason}` : ""}
                  </span>
                  <form action={removeBlockedDateAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className="text-xs text-red-700 underline">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Special prices</h2>
          <p className="mt-1 text-xs text-river-500">
            Peak dates such as Eid or New Year. A tour-specific price beats an all-tours price for
            the same date.
          </p>
          <form action={addSpecialPriceAction} className="mt-3 grid gap-2 sm:grid-cols-5">
            <label className="block">
              <span className={labelClass}>Date</span>
              <input type="date" name="date" required className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Tour</span>
              <select name="tour_id" className={inputClass} defaultValue="">
                <option value="">All tours</option>
                {tours.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Adult IDR</span>
              <input name="price_adult" type="number" min="0" step="1000" className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Child IDR</span>
              <input name="price_child" type="number" min="0" step="1000" className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Label</span>
              <input name="label" className={inputClass} placeholder="Peak season" />
            </label>
            <div className="sm:col-span-5">
              <button type="submit" className={buttonPrimary}>
                Add special price
              </button>
            </div>
          </form>

          {specials.length > 0 ? (
            <ul className="mt-4 divide-y divide-river-50 text-sm">
              {specials.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    {row.date} · {row.tour_name ?? "All tours"} ·{" "}
                    {formatRupiah(row.price_adult)} adult / {formatRupiah(row.price_child)} child
                    {row.label ? ` · ${row.label}` : ""}
                  </span>
                  <form action={removeSpecialPriceAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className="text-xs text-red-700 underline">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export const instant = false;
