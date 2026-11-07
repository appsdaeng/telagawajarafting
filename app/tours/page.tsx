import type { Metadata } from "next";
import Link from "next/link";
import { formatRupiah, siteConfig, tours, whatsappLink } from "@/lib/tours";

export const metadata: Metadata = {
  title: "Tours and prices",
  description:
    "Telaga Waja rafting tours and prices in IDR. Signature run, sunrise run, and the rafting plus Ubud tour. Equipment, guide and lunch included.",
};

export default function ToursPage() {
  return (
    <div className="container-page py-16 sm:py-20">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-widest text-river-500 uppercase">Tours</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Tours and prices
        </h1>
        <p className="mt-4 leading-relaxed text-river-800">
          Every tour includes your guide, all safety equipment, lunch and a hot shower at base
          camp. Prices are per person in Indonesian rupiah.
        </p>
      </header>

      <ul className="mt-12 space-y-6">
        {tours.map((tour) => (
          <li
            key={tour.slug}
            className="grid gap-6 rounded-3xl border border-river-100 p-6 sm:p-8 lg:grid-cols-[1.6fr_1fr]"
          >
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{tour.name}</h2>
              <p className="mt-1 text-sm font-medium text-river-600">{tour.tagline}</p>
              <p className="mt-4 text-sm leading-relaxed text-river-800">{tour.description}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs tracking-widest text-river-500 uppercase">Duration</dt>
                  <dd className="mt-1 font-medium">{tour.duration}</dd>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <dt className="text-xs tracking-widest text-river-500 uppercase">Meeting point</dt>
                  <dd className="mt-1 font-medium">{tour.meetingPoint}</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col justify-between gap-6 rounded-2xl bg-river-50 p-6">
              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-river-700">Adult</dt>
                  <dd className="text-lg font-semibold">{formatRupiah(tour.priceAdult)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-river-700">Child (7–12)</dt>
                  <dd className="text-lg font-semibold">{formatRupiah(tour.priceChild)}</dd>
                </div>
              </dl>
              <div className="space-y-2">
                <a
                  href={whatsappLink(
                    `Hi ${siteConfig.name}, I would like to book the ${tour.name}. Date: ___, people: ___`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-full bg-river-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-river-700"
                >
                  Book this tour
                </a>
                <Link
                  href={`/tours/${tour.slug}`}
                  className="block rounded-full px-5 py-2 text-center text-sm font-semibold text-river-700 hover:bg-white"
                >
                  What&apos;s included →
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-river-600">
        Group rates, hotel pickup outside the listed areas and private rafts can be arranged —
        just ask on WhatsApp.
      </p>
    </div>
  );
}
