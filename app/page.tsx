import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookingWidget } from "@/app/components/booking-widget";
import { FaqList } from "@/app/components/faq-list";
import { HeroMedia } from "@/app/components/hero-media";
import { JsonLd } from "@/app/components/json-ld";
import { TourCard } from "@/app/components/tour-card";
import {
  dayTimeline,
  faqs,
  gallery,
  includedItems,
  reviews,
  safetyPoints,
  trustPoints,
} from "@/lib/content";
import { businessJsonLd } from "@/lib/schema";
import { formatRupiah, siteConfig, tours, whatsappLink } from "@/lib/tours";

export const metadata: Metadata = {
  title: "Telaga Waja Rafting Bali | Book Online",
  description:
    "Raft 14 km of Class II–III rapids on the Telaga Waja river, Karangasem. From IDR 450,000 per person incl. guide, lunch and hotel pickup. Book in minutes.",
  alternates: { canonical: "/" },
};

const stats = [
  { label: "On the water", value: "2.5–3h" },
  { label: "River distance", value: "14 km" },
  { label: "Rapids", value: "II–III" },
  { label: "Minimum age", value: "7 yrs" },
];

export default function HomePage() {
  const fromPrice = Math.min(...tours.map((tour) => tour.priceAdult));
  const homeFaqs = faqs.slice(0, 5);

  return (
    <>
      <JsonLd data={businessJsonLd()} />

      {/* Hero — media is supplied by the operator; the component falls back to a gradient. */}
      <section className="relative isolate overflow-hidden bg-river-950 text-white">
        <HeroMedia
          video="/media/hero.mp4"
          image="/media/hero.jpg"
          alt="Guests rafting through rapids on the Telaga Waja river in Bali"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-river-950)_0%,rgba(8,38,43,0.72)_45%,rgba(8,38,43,0.45)_100%)]"
        />

        <div className="relative container-page pt-16 pb-28 sm:pt-24 lg:pt-32 lg:pb-36">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
            <span className="size-1.5 rounded-full bg-sand-400" aria-hidden="true" />
            Rendang, Karangasem · open daily
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance-tight sm:text-5xl lg:text-6xl">
            Telaga Waja Rafting in Bali — Bali&apos;s longest run.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-river-100 sm:text-lg">
            Fourteen kilometres of Class II–III rapids through a jungle canyon, finishing with the
            drop everyone talks about. Guide, safety gear, lunch and hotel pickup included.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#book"
              className="rounded-full bg-sand-400 px-6 py-3 text-sm font-semibold text-river-950 transition-colors hover:bg-sand-300"
            >
              Check availability
            </a>
            <Link
              href="/tours"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Tours and prices
            </Link>
          </div>

          <p className="mt-6 text-sm text-river-200">
            Book in 2 minutes · Confirmed on WhatsApp · From{" "}
            <strong className="font-semibold text-white">{formatRupiah(fromPrice)}</strong> per
            person
          </p>

          <dl className="mt-10 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <dd className="text-xl font-semibold tracking-tight text-white">{stat.value}</dd>
                <dt className="mt-0.5 text-[0.65rem] tracking-widest text-river-200 uppercase">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Booking widget, pulled up over the hero edge. */}
      <section aria-labelledby="book-heading" className="relative z-10 -mt-16 sm:-mt-20">
        <div className="container-page">
          <div className="mx-auto max-w-4xl">
            <h2 id="book-heading" className="sr-only">
              Check availability
            </h2>
            <BookingWidget
              options={tours.map((tour) => ({
                slug: tour.slug,
                name: tour.name,
                priceAdult: tour.priceAdult,
                priceChild: tour.priceChild,
              }))}
            />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section aria-label="Why book with us" className="container-page py-12">
        <ul className="grid gap-4 border-y border-river-100 py-8 sm:grid-cols-2 lg:grid-cols-5">
          {trustPoints.map((point) => (
            <li key={point.title}>
              <p className="flex items-center gap-2 text-sm font-semibold text-river-950">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="size-4 shrink-0 text-river-600"
                  fill="currentColor"
                >
                  <path d="M10 1.7 3.5 4.4v5.2c0 4 2.8 7.6 6.5 8.7 3.7-1.1 6.5-4.7 6.5-8.7V4.4z" />
                </svg>
                {point.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-river-700">{point.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Tours */}
      <section className="container-page pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Choose your run</h2>
            <p className="mt-3 text-river-800">
              Three ways to do the river. All prices are per person and include equipment, guide,
              lunch and hotel pickup.
            </p>
          </div>
          <Link
            href="/tours"
            className="text-sm font-semibold text-river-600 underline-offset-4 hover:underline"
          >
            Compare all tours →
          </Link>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </ul>
      </section>

      {/* What's included */}
      <section className="container-page py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          What&apos;s included in every trip
        </h2>
        <p className="mt-3 max-w-xl text-river-800">
          One price, nothing to add at the counter. The only extras are photos if you want them.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {includedItems.map((item) => (
            <li key={item.title} className="rounded-2xl bg-river-50/70 p-5 ring-1 ring-river-100">
              <h3 className="font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-river-800">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Your day */}
      <section className="bg-river-950 py-20 text-white">
        <div className="container-page">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How the day runs</h2>
          <p className="mt-3 max-w-xl text-river-200">
            From hotel pickup to the drive back. Times shift a little with traffic and pickup area.
          </p>
          <ol className="mt-10 grid gap-6 md:grid-cols-5">
            {dayTimeline.map((step, index) => (
              <li key={step.title} className="border-t border-river-700 pt-4">
                <p className="text-xs font-semibold tracking-widest text-sand-300 uppercase">
                  {String(index + 1).padStart(2, "0")} · {step.time}
                </p>
                <h3 className="mt-2 font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-river-200">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Safety */}
      <section className="container-page py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Safety on the water</h2>
            <p className="mt-3 leading-relaxed text-river-800">
              Rafting is an adventure sport, and we run it like one: briefed, equipped and guided
              rather than improvised. If the river is not safe on the day, we cancel — your safety
              outranks your booking.
            </p>
            <a
              href={whatsappLink(`Hi ${siteConfig.name}, I have a question about safety on the rafting trip.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-full border border-river-300 px-5 py-2.5 text-sm font-semibold text-river-800 transition-colors hover:bg-river-50"
            >
              Ask us a safety question
            </a>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {safetyPoints.map((point) => (
              <li
                key={point}
                className="flex gap-2.5 rounded-xl bg-white p-4 text-sm leading-relaxed text-river-900 ring-1 ring-river-100"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="mt-0.5 size-4 shrink-0 text-river-600"
                  fill="currentColor"
                >
                  <path d="M10 1.7 3.5 4.4v5.2c0 4 2.8 7.6 6.5 8.7 3.7-1.1 6.5-4.7 6.5-8.7V4.4z" />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Reviews — only with real guest quotes from Google/TripAdvisor. */}
      {reviews.length > 0 ? (
        <section className="bg-river-50/70 py-20">
          <div className="container-page">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What guests say</h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {reviews.slice(0, 3).map((review) => (
                <li key={`${review.name}-${review.date}`} className="rounded-2xl bg-white p-6 ring-1 ring-river-100">
                  <p className="text-sm leading-relaxed text-river-900">“{review.quote}”</p>
                  <p className="mt-4 text-xs font-semibold text-river-700">
                    {review.name} · {review.country}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Gallery preview — only when photos exist. */}
      {gallery.length > 0 ? (
        <section className="container-page py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">On the river</h2>
            <Link
              href="/gallery"
              className="text-sm font-semibold text-river-600 underline-offset-4 hover:underline"
            >
              See the gallery →
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.slice(0, 6).map((image) => (
              <li key={image.src} className="relative aspect-4/3 overflow-hidden rounded-2xl bg-river-100">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* FAQ */}
      <section className="container-page py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Questions guests ask
            </h2>
            <p className="mt-3 leading-relaxed text-river-800">
              Booking, payment, what to bring and what happens if it rains.
            </p>
            <Link
              href="/faq"
              className="mt-5 inline-flex text-sm font-semibold text-river-600 underline-offset-4 hover:underline"
            >
              All questions and answers →
            </Link>
          </div>
          <FaqList items={homeFaqs} />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container-page pb-4">
        <div className="rounded-3xl bg-river-900 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to book your rafting trip?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-river-100">
            Tell us the date and how many of you there are — we reply with availability and your
            pickup time, usually within a few minutes.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href={whatsappLink(`Hi ${siteConfig.name}, I would like to book a rafting trip.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-sand-400 px-6 py-3 text-sm font-semibold text-river-950 transition-colors hover:bg-sand-300"
            >
              Message us on WhatsApp
            </a>
            <a
              href="#book"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Back to the booking box
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
