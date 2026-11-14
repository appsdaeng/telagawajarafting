import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutPage } from "@/app/components/checkout-page";
import { asTourOptions } from "@/lib/tour-options";
import { getTourRow } from "@/lib/tour-row";
import { getTour } from "@/lib/tours";

export const metadata: Metadata = {
  title: "Your details and payment",
  // A checkout is for one guest at a time; it should not be indexed.
  robots: { index: false, follow: false },
};

// The page reads the query string and the database, so it renders per request
// instead of being prerendered.
export const instant = false;

/**
 * The checkout step after the booking window.
 *
 * It re-reads the tour so the option, its price and its fields are the ones in
 * the database now, not whatever a cached page still shows.
 */
export default async function CheckoutTourPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    option?: string;
    date?: string;
    time?: string;
    adults?: string;
    children?: string;
  }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const tour = getTour(slug);
  const row = await getTourRow(slug);

  if (!tour && !row) {
    notFound();
  }

  const options = asTourOptions(row?.pricing_options);
  const count = (value: string | undefined, min: number, max: number, fallback: number) => {
    const number = Math.trunc(Number(value));
    return Math.min(max, Math.max(min, Number.isFinite(number) && value ? number : fallback));
  };

  return (
    <div className="min-h-screen bg-river-50/50 py-6 sm:py-10">
      <div className="container-page">
        <CheckoutPage
          slug={slug}
          tourName={row?.name?.trim() || tour?.name || "Tour"}
          duration={row?.duration?.trim() || tour?.duration || ""}
          meetingPoint={row?.meeting_point?.trim() || tour?.meetingPoint || ""}
          imageUrl={row?.image_url?.trim() || tour?.image?.src || ""}
          options={options}
          adultPrice={row?.price_adult || tour?.priceAdult || 0}
          childPrice={row?.price_child || tour?.priceChild || 0}
          initialOption={query.option ?? ""}
          initialDate={query.date ?? ""}
          initialTime={query.time ?? ""}
          initialAdults={count(query.adults, 1, 20, 2)}
          initialChildren={count(query.children, 0, 20, 0)}
        />
      </div>
    </div>
  );
}
