import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/app/components/json-ld";
import { breadcrumbJsonLd } from "@/lib/schema";
import { getTourPhotos } from "@/lib/tour-photo";
import { formatRupiah, siteConfig, tours, whatsappLink } from "@/lib/tours";

export const metadata: Metadata = {
  title: "Rafting Tours & Prices in Bali",
  description:
    "Compare Telaga Waja rafting tours and prices in IDR: the signature 14 km run, the sunrise run and rafting plus a Ubud tour. Guide, lunch and pickup included.",
  alternates: { canonical: "/tours" },
};

export default async function ToursPage() {
  // One cover photo per tour, exactly as the operator chose it in the admin.
  const covers = await Promise.all(
    tours.map(async (tour) => (await getTourPhotos(tour.slug, tour.image))[0] ?? null),
  );

  return (
    <div className="container-page py-16 sm:py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tours", path: "/tours" },
        ])}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-river-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-river-900 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-river-900">
            Tours
          </li>
        </ol>
      </nav>

      <header className="mt-6 max-w-2xl">
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
        {tours.map((tour, index) => {
          const cover = covers[index];

          return (
            <li
              key={tour.slug}
              className="overflow-hidden rounded-3xl border border-river-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {cover ? (
                <div className="relative h-52 w-full overflow-hidden bg-river-100 sm:h-64">
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    // Uploaded photos live on Supabase Storage: skip the optimizer
                    // rather than allowlisting the operator's host at build time.
                    unoptimized
                    sizes="(min-width: 1152px) 1152px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.6fr_1fr]">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    <Link href={`/tours/${tour.slug}`} className="hover:text-river-700">
                      {tour.name}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm font-medium text-river-600">{tour.tagline}</p>
                  <p className="mt-4 text-sm leading-relaxed text-river-800">{tour.description}</p>
                  <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs tracking-widest text-river-500 uppercase">Duration</dt>
                      <dd className="mt-1 font-medium">{tour.duration}</dd>
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <dt className="text-xs tracking-widest text-river-500 uppercase">
                        Meeting point
                      </dt>
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
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 text-sm text-river-600">
        Group rates, hotel pickup outside the listed areas and private rafts can be arranged —
        just ask on WhatsApp.
      </p>
    </div>
  );
}
