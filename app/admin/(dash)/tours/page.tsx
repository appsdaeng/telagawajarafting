import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listTours } from "@/lib/bookings";
import { formatRupiah } from "@/lib/tours";
import {
  Badge,
  Card,
  PageHeader,
  buttonPrimary,
  buttonSecondary,
} from "@/app/admin/_components/ui";
import { duplicateTourAction, toggleTourAction } from "../actions";

export const metadata: Metadata = { title: "Tours" };

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const tours = await listTours(true);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tours"
        description="Prices, copy, photos and SEO for every tour. Hidden tours keep their data and bookings."
        actions={
          <Link href="/admin/tours/new" className={buttonPrimary}>
            New tour
          </Link>
        }
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="space-y-3">
        {tours.map((tour) => (
          <Card key={tour.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{tour.name}</h2>
                  <Badge tone={tour.published ? "green" : "slate"}>
                    {tour.published ? "Published" : "Hidden"}
                  </Badge>
                  {tour.popular ? <Badge tone="amber">Most popular</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-river-500">
                  /{tour.slug} · {tour.duration || "no duration set"} · order {tour.sort_order}
                </p>
                <p className="mt-2 text-sm text-river-700">
                  Adult {formatRupiah(tour.price_adult)} · Child {formatRupiah(tour.price_child)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/tours/${tour.id}`} className={buttonSecondary}>
                  Edit
                </Link>
                <form action={toggleTourAction}>
                  <input type="hidden" name="id" value={tour.id} />
                  <button type="submit" className={buttonSecondary}>
                    {tour.published ? "Hide" : "Publish"}
                  </button>
                </form>
                <form action={duplicateTourAction}>
                  <input type="hidden" name="id" value={tour.id} />
                  <button type="submit" className={buttonSecondary}>
                    Duplicate
                  </button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-river-500">
        The public tour pages still read the catalogue in <code>lib/tours.ts</code>. Editing here
        changes what the portal and POS sell; flipping the public pages onto these rows is the next
        step and is tracked in the README.
      </p>
    </div>
  );
}

export const instant = false;
