import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingPage } from "@/app/components/booking-page";
import { getTourRow } from "@/lib/tour-row";
import { getTour } from "@/lib/tours";

export const metadata: Metadata = {
  title: "Book your tour",
  // A booking page is for one guest at a time; it should not be indexed.
  robots: { index: false, follow: false },
};

// The page reads the query string and the database, so it renders per request
// instead of being prerendered.
export const instant = false;

/**
 * The booking window, opened from an option card on the tour page.
 *
 * It reads the tour from the database (falling back to the bundled catalogue)
 * and the choice from the query string, so the operator's current options,
 * prices and extra fields are what the guest sees.
 */
export default async function BookTourPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    option?: string;
    date?: string;
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

  const options = Array.isArray(row?.pricing_options) ? row.pricing_options : [];
  const price = (value?: string) => {
    const number = Math.trunc(Number(value));
    return Number.isFinite(number) ? number : 0;
  };

  return (
    <div className="min-h-screen bg-river-50/50 py-6 sm:py-10">
      <div className="container-page">
        <BookingPage
          slug={slug}
          tourName={row?.name?.trim() || tour?.name || "Tour"}
          duration={row?.duration?.trim() || tour?.duration || ""}
          meetingPoint={row?.meeting_point?.trim() || tour?.meetingPoint || ""}
          options={options}
          adultPrice={row?.price_adult || tour?.priceAdult || 0}
          childPrice={row?.price_child || tour?.priceChild || 0}
          initialOption={query.option ?? ""}
          initialDate={query.date ?? ""}
          initialAdults={Math.min(20, Math.max(1, price(query.adults) || 2))}
          initialChildren={Math.min(20, Math.max(0, price(query.children)))}
        />
      </div>
    </div>
  );
}
