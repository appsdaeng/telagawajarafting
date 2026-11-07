import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatRupiah, getTour, siteConfig, tours, whatsappLink } from "@/lib/tours";

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

  return {
    title: tour.name,
    description: tour.tagline,
    openGraph: {
      title: `${tour.name} · ${siteConfig.name}`,
      description: tour.tagline,
    },
  };
}

export default async function TourDetailPage(props: PageProps<"/tours/[slug]">) {
  const { slug } = await props.params;
  const tour = getTour(slug);

  if (!tour) {
    notFound();
  }

  return (
    <article className="container-page py-16 sm:py-20">
      <Link
        href="/tours"
        className="text-sm font-medium text-river-600 underline-offset-4 hover:underline"
      >
        ← All tours
      </Link>

      <header className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-balance-tight sm:text-4xl">
          {tour.name}
        </h1>
        <p className="mt-3 text-lg text-river-700">{tour.tagline}</p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="leading-relaxed text-river-900">{tour.description}</p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">Highlights</h2>
            <ul className="mt-4 space-y-2.5">
              {tour.highlights.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-river-900">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-river-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">What&apos;s included</h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {tour.includes.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-river-900">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="mt-0.5 size-4 shrink-0 text-river-600"
                    fill="currentColor"
                  >
                    <path d="M8.2 13.9 4.3 10l1.4-1.4 2.5 2.5 5.1-5.1L14.7 7z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 rounded-2xl bg-river-50 p-6">
            <h2 className="text-lg font-semibold tracking-tight">Good to know</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs tracking-widest text-river-500 uppercase">Duration</dt>
                <dd className="mt-1 font-medium">{tour.duration}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-widest text-river-500 uppercase">Meeting point</dt>
                <dd className="mt-1 font-medium">{tour.meetingPoint}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-river-800">
              Bring a change of clothes, sunscreen and a dry bag for phones. Lockers are
              available at base camp.
            </p>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-river-100 p-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold tracking-widest text-river-500 uppercase">Price</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex items-baseline justify-between gap-4 border-b border-river-100 pb-3">
              <dt className="text-sm text-river-800">Adult</dt>
              <dd className="text-xl font-semibold">{formatRupiah(tour.priceAdult)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-river-800">Child (7–12)</dt>
              <dd className="text-xl font-semibold">{formatRupiah(tour.priceChild)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-river-600">
            Per person, including equipment, guide and lunch. Paid at the counter on the day.
          </p>
          <a
            href={whatsappLink(
              `Hi ${siteConfig.name}, I would like to book the ${tour.name}. Date: ___, people: ___`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block rounded-full bg-river-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-river-700"
          >
            Book on WhatsApp
          </a>
        </aside>
      </div>
    </article>
  );
}
