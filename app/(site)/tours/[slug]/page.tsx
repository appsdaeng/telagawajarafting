import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/app/components/json-ld";
import { TourGallery } from "@/app/components/tour-gallery";
import { breadcrumbJsonLd, tourJsonLd } from "@/lib/schema";
import { getTourItinerary } from "@/lib/tour-itinerary";
import { getTourPhoto, getTourPhotos } from "@/lib/tour-photo";
import { getTourRow } from "@/lib/tour-row";
import type { Tour } from "@/lib/tours";
import { formatRupiah, getTour, siteConfig, tours, whatsappLink } from "@/lib/tours";

function mergeTour(tour: Tour, db: Awaited<ReturnType<typeof getTourRow>>) {
  if (!db) {
    return tour;
  }

  return {
    ...tour,
    name: db.name?.trim() || tour.name,
    tagline: db.tagline?.trim() || tour.tagline,
    description: db.description?.trim() || tour.description,
    priceAdult: db.price_adult || tour.priceAdult,
    priceChild: db.price_child || tour.priceChild,
    duration: db.duration?.trim() || tour.duration,
    meetingPoint: db.meeting_point?.trim() || tour.meetingPoint,
    includes: db.includes?.length ? db.includes : tour.includes,
    highlights: db.highlights?.length ? db.highlights : tour.highlights,
    story: db.story?.length ? db.story : tour.story,
    goodToKnow: db.good_to_know?.length ? db.good_to_know : tour.goodToKnow,
    popular: db.popular ?? tour.popular,
  };
}

export function generateStaticParams() {
  return tours.map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata(
  props: PageProps<"/tours/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const tour = getTour(slug);

  if (!tour) {
    return { title: "Tour not found" };
  }

  const t = mergeTour(tour, await getTourRow(slug));
  const description = `${t.tagline}. ${formatRupiah(t.priceAdult)} per adult, including guide, equipment, lunch and hotel pickup.`;
  const photo = await getTourPhoto(tour.slug, tour.image);

  return {
    // Absolute: the tour name already contains the brand, so the layout's
    // "%s | Telaga Waja Rafting" template would repeat it.
    title: { absolute: `${t.name} — Prices & Booking` },
    description,
    alternates: { canonical: `/tours/${tour.slug}` },
    openGraph: {
      title: `${t.name} · ${siteConfig.name}`,
      description,
      ...(photo ? { images: [{ url: photo.src, alt: photo.alt }] } : {}),
    },
  };
}

export default async function TourDetailPage(props: PageProps<"/tours/[slug]">) {
  const { slug } = await props.params;
  const tour = getTour(slug);

  if (!tour) {
    notFound();
  }

  // Admin edits live in Postgres; fall back to the bundled catalogue when a
  // field is empty so unedited tours still render their original copy.
  const t = mergeTour(tour, await getTourRow(slug));

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Tours", path: "/tours" },
    { name: t.name, path: `/tours/${tour.slug}` },
  ];
  // Set in Admin → Tours; falls back to a bundled photo so the header is never empty.
  const photos = await getTourPhotos(tour.slug, tour.image);
  // Set in Admin → Tours, shown under Highlights; empty means no section at all.
  const itinerary = await getTourItinerary(tour.slug);

  return (
    <article>
      <JsonLd data={tourJsonLd(t)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      {/* Full-bleed banner directly under the sticky header, with arrows through
          the operator's gallery. The first photo is the cover that cards use. */}
      <TourGallery images={photos} />

      <div className="container-page pt-8 pb-16 sm:pt-10 sm:pb-20">
        <nav aria-label="Breadcrumb" className="text-sm text-river-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-river-900 hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/tours" className="hover:text-river-900 hover:underline">
                Tours
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-river-900">
              {t.name}
            </li>
          </ol>
        </nav>

        <header className="mt-6 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-balance-tight sm:text-4xl">
            {t.name}
          </h1>
          <p className="mt-3 text-lg text-river-700">{t.tagline}</p>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="space-y-4 leading-relaxed text-river-900">
              {t.story.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} dangerouslySetInnerHTML={{ __html: paragraph }} />
              ))}
            </div>

            <section className="mt-10">
              <h2 className="text-lg font-semibold tracking-tight">Highlights</h2>
              <ul className="mt-4 space-y-2.5">
                {t.highlights.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-river-900">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-river-500"
                    />
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            </section>

            {itinerary.length > 0 ? (
              <section className="mt-10">
                <h2 className="text-lg font-semibold tracking-tight">Itinerary</h2>
                <ol className="mt-4 space-y-3">
                  {itinerary.map((step, index) => (
                    <li
                      key={`${index}-${step.slice(0, 24)}`}
                      className="flex gap-3 text-sm leading-relaxed text-river-900"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-river-50 text-[0.7rem] font-semibold text-river-600"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: step }} />
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section className="mt-10">
              <h2 className="text-lg font-semibold tracking-tight">What&apos;s included</h2>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {t.includes.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-river-900">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="mt-0.5 size-4 shrink-0 text-river-600"
                      fill="currentColor"
                    >
                      <path d="M8.2 13.9 4.3 10l1.4-1.4 2.5 2.5 5.1-5.1L14.7 7z" />
                    </svg>
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10 rounded-2xl bg-river-50 p-6">
              <h2 className="text-lg font-semibold tracking-tight">Good to know</h2>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs tracking-widest text-river-500 uppercase">Duration</dt>
                  <dd className="mt-1 font-medium">{t.duration}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-widest text-river-500 uppercase">
                    Meeting point
                  </dt>
                  <dd className="mt-1 font-medium">{t.meetingPoint}</dd>
                </div>
              </dl>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-river-800">
                {t.goodToKnow.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="h-fit rounded-3xl border border-river-100 p-6 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold tracking-widest text-river-500 uppercase">Price</h2>
            <dl className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between gap-4 border-b border-river-100 pb-3">
                <dt className="text-sm text-river-800">Adult</dt>
                <dd className="text-xl font-semibold">{formatRupiah(t.priceAdult)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-river-800">Child (7–12)</dt>
                <dd className="text-xl font-semibold">{formatRupiah(t.priceChild)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-river-600">
              Per person, including equipment, guide, lunch and hotel pickup. Paid at base camp on
              the day — no card details online.
            </p>
            <Link
              href={{ pathname: "/", query: { tour: tour.slug }, hash: "book" }}
              className="mt-6 block rounded-full bg-river-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-river-700"
            >
              Check availability
            </Link>
            <a
              href={whatsappLink(
                `Hi ${siteConfig.name}, I would like to book the ${t.name}. Date: ___, people: ___`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block rounded-full border border-river-300 px-5 py-2.5 text-center text-sm font-semibold text-river-800 transition-colors hover:bg-river-50"
            >
              Ask on WhatsApp
            </a>
          </aside>
        </div>
      </div>
    </article>
  );
}
