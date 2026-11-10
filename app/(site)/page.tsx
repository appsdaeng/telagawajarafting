import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookingWidget } from "@/app/components/booking-widget";
import { FaqList } from "@/app/components/faq-list";
import { HeroMedia } from "@/app/components/hero-media";
import { JsonLd } from "@/app/components/json-ld";
import { TourCard } from "@/app/components/tour-card";
import { Droplets, SplashUnderline, WaveDivider } from "@/app/components/wave-divider";
import {
  dayTimeline,
  faqs,
  gallery,
  includedItems,
  paymentMethods,
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
  { label: "Rapids", value: "Class II–III" },
  { label: "Minimum age", value: "7 yrs" },
];

const bringList = [
  "Swimwear or quick-dry clothes",
  "A change of clothes and a towel",
  "Dry bag or waterproof phone case",
  "Sandals or reef shoes that strap on",
  "Sunscreen and a cap",
  "Cash for photos and drinks",
];

/** One extra selling point on top of the shared trust points. */
const whyChoose = [
  ...trustPoints,
  {
    title: "Bali's longest run",
    body: "14 km of continuous Class II–III rapids — the longest rafting descent on the island.",
  },
];

const includedIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("equipment")) return "🛟";
  if (t.includes("guide")) return "🧭";
  if (t.includes("pickup")) return "🚐";
  if (t.includes("lunch")) return "🍽️";
  if (t.includes("shower")) return "🚿";
  if (t.includes("insurance")) return "⛑️";
  return "✅";
};

export default function HomePage() {
  const fromPrice = Math.min(...tours.map((tour) => tour.priceAdult));
  const homeFaqs = faqs.slice(0, 5);

  return (
    <>
      <JsonLd data={businessJsonLd()} />

      {/* Hero — the operator's photo sits under a dark wash so the headline reads. */}
      <section className="relative isolate overflow-hidden bg-river-950 text-white">
        <HeroMedia
          video="/media/hero.mp4"
          image="/media/hero.jpg"
          alt="Guests in helmets and life jackets paddling a raft through white water on the Telaga Waja river"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-river-950)_2%,rgba(8,38,43,0.78)_45%,rgba(8,38,43,0.42)_100%)]"
        />

        <div className="relative container-page pt-14 pb-40 sm:pt-20 sm:pb-48 lg:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold tracking-widest uppercase backdrop-blur">
            <span className="size-1.5 rounded-full bg-sand-400" aria-hidden="true" />
            Rendang, Karangasem · open daily
          </p>

          <h1 className="mt-5 max-w-4xl text-[2.5rem] leading-[0.95] font-extrabold tracking-tight uppercase text-balance-tight sm:text-6xl lg:text-7xl">
            The Adrenaline Rush Through Unparalleled River Rapids
          </h1>

          <SplashUnderline className="text-sand-400" />

          <p className="mt-5 max-w-xl text-base leading-relaxed text-river-100 sm:text-lg">
            Fourteen kilometres of Class II–III white water through a jungle canyon — then the drop
            everyone talks about. Guide, safety gear, lunch and hotel pickup included.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#book"
              className="rounded-full bg-sand-400 px-7 py-3.5 text-sm font-bold tracking-wide text-river-950 uppercase transition-colors hover:bg-sand-300"
            >
              Book now
            </a>
            <Link
              href="/tours"
              className="rounded-full border-2 border-white/40 px-6 py-3 text-sm font-bold tracking-wide uppercase transition-colors hover:bg-white/15"
            >
              Tours &amp; prices
            </Link>
          </div>

          <p className="mt-6 text-sm text-river-200">
            From{" "}
            <strong className="font-semibold text-white">{formatRupiah(fromPrice)}</strong> per
            person · confirmed on WhatsApp
          </p>

          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur"
              >
                <dd className="text-lg font-bold tracking-tight text-white">{stat.value}</dd>
                <dt className="mt-0.5 text-[0.6rem] font-semibold tracking-widest text-river-200 uppercase">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <WaveDivider fill="white" />
      </section>

      {/* Booking widget, sitting on the waterline. */}
      <section aria-label="Check availability" className="relative z-20 -mt-10 sm:-mt-16">
        <div className="container-page">
          <div className="mx-auto max-w-4xl">
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

      {/* Introduction */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-river-600 uppercase">
              Telaga Waja Adventure · TWA Rafting
            </p>
            <h2 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
              Your ultimate thrilling experience
            </h2>
            <SplashUnderline className="text-river-400" />
            <p className="mt-5 leading-relaxed text-river-800">
              The Telaga Waja is the longest rafting run in Bali that most operators will take a
              beginner on. You put in near Rendang, high in the Karangasem hills, and work your way
              down a narrow canyon of clear, cold spring water — open all year, even in the wet
              season.
            </p>
            <p className="mt-4 leading-relaxed text-river-800">
              No experience is needed. Your guide steers from the back and calls the strokes, a
              safety kayak shadows the group, and non-swimmers ride along comfortably. You finish
              with a four-metre drop under the bridge, a hot shower and lunch on the terrace.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={whatsappLink(`Hi ${siteConfig.name}, I would like to book a rafting trip.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-river-700 px-6 py-3 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-river-800"
              >
                Book with us
              </a>
              <Link
                href="/tours/telaga-waja-rafting"
                className="rounded-full border-2 border-river-200 px-6 py-3 text-sm font-bold tracking-wide text-river-800 uppercase transition-colors hover:bg-river-50"
              >
                About the river
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-river-50 ring-1 ring-river-100">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(160deg,var(--color-river-500),var(--color-river-800))]"
            >
              <WaveDivider fill="river" className="h-10 sm:h-12" />
            </div>
            <div className="relative px-6 pt-16 pb-6">
              <Droplets className="text-river-400" />
              <h3 className="mt-4 text-lg font-bold tracking-tight uppercase">Good to know</h3>
              <ul className="mt-4 space-y-3 text-sm text-river-900">
                <li className="flex gap-2.5">
                  <span aria-hidden="true">🚣</span>
                  14 km of continuous Class II–III rapids
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden="true">⏱️</span>
                  Two and a half to three hours on the water
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden="true">👨‍👩‍👧</span>
                  Ages 7 and up · non-swimmers welcome
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden="true">🏁</span>
                  The 4-metre drop below the bridge
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden="true">❌</span>
                  Not during pregnancy or with serious back problems
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tours */}
      <section id="tours" className="container-page pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-bold tracking-[0.2em] text-river-600 uppercase">
              Pick your adventure
            </p>
            <h2 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
              Telaga Waja river rafting
            </h2>
            <SplashUnderline className="text-river-400" />
            <p className="mt-4 text-river-800">
              Three ways to do the river. Every price is per person and already includes the
              equipment, guide, lunch and hotel pickup.
            </p>
          </div>
          <Link
            href="/tours"
            className="text-sm font-bold tracking-wide text-river-700 uppercase underline-offset-4 hover:underline"
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

      {/* Know before you go — what is included, and what to bring. */}
      <section className="relative mt-16 bg-river-50 pt-24 pb-28">
        <WaveDivider fill="white" position="top" />
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
              Know before you start your river adventure
            </h2>
            <SplashUnderline className="mx-auto text-river-400" />
            <p className="mt-4 text-river-800">
              Prepare for an unforgettable Bali experience and book your adventure with confidence.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-river-100 sm:p-8">
              <h3 className="text-xl font-bold tracking-tight uppercase">🚐 What&apos;s included?</h3>
              <ul className="mt-5 space-y-3.5">
                {includedItems.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span aria-hidden="true" className="text-base">
                      {includedIcon(item.title)}
                    </span>
                    <span>
                      <span className="text-sm font-semibold text-river-950">{item.title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-river-700">
                        {item.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-white p-6 ring-1 ring-river-100 sm:p-8">
              <h3 className="text-xl font-bold tracking-tight uppercase">🎒 Recommended to bring</h3>
              <ul className="mt-5 space-y-3">
                {bringList.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-river-900">
                    <span aria-hidden="true" className="text-river-500">
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl bg-sand-50 p-5 ring-1 ring-sand-200">
                <p className="text-xs font-bold tracking-[0.15em] text-sand-900 uppercase">
                  Free cancellation
                </p>
                <p className="mt-2 text-sm leading-relaxed text-river-800">
                  Cancel at no cost up to 48 hours before your departure. If the river is unsafe on
                  the day, we cancel and refund — your safety outranks your booking.
                </p>
              </div>
            </div>
          </div>
        </div>
        <WaveDivider fill="white" />
      </section>

      {/* Why choose us */}
      <section className="container-page pt-24 pb-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
            Why choose Telaga Waja Rafting?
          </h2>
          <SplashUnderline className="mx-auto text-river-400" />
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyChoose.map((point) => (
            <li
              key={point.title}
              className="relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-river-100 transition-shadow hover:shadow-md"
            >
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center rounded-xl bg-river-50 text-river-600"
              >
                <svg viewBox="0 0 20 20" className="size-5" fill="currentColor">
                  <path d="M10 1.7 3.5 4.4v5.2c0 4 2.8 7.6 6.5 8.7 3.7-1.1 6.5-4.7 6.5-8.7V4.4z" />
                </svg>
              </span>
              <h3 className="mt-4 font-bold tracking-tight">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-river-800">{point.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Your day */}
      <section id="day" className="relative bg-river-950 pt-24 pb-28 text-white">
        <WaveDivider fill="white" position="top" />
        <div className="container-page">
          <div className="max-w-xl">
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
              How your day runs
            </h2>
            <SplashUnderline className="text-sand-400" />
            <p className="mt-4 text-river-200">
              From hotel pickup to the drive back. Times shift a little with traffic and your pickup
              area.
            </p>
          </div>

          <ol className="mt-10 grid gap-6 md:grid-cols-5">
            {dayTimeline.map((step, index) => (
              <li key={step.title} className="border-t-2 border-river-700 pt-4">
                <p className="text-xs font-bold tracking-widest text-sand-300 uppercase">
                  {String(index + 1).padStart(2, "0")} · {step.time}
                </p>
                <h3 className="mt-2 font-bold tracking-tight">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-river-200">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <WaveDivider fill="white" />
      </section>

      {/* Payment */}
      <section aria-labelledby="payment-heading" className="container-page pt-24 pb-20">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <div>
            <h2
              id="payment-heading"
              className="text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl"
            >
              Easy payment
            </h2>
            <SplashUnderline className="text-river-400" />
            <p className="mt-4 leading-relaxed text-river-800">
              Nothing is charged when you send the booking form. Once your spots are confirmed we
              send the payment details on WhatsApp, and you pick whichever way is easiest.
            </p>
            <p className="mt-4 text-sm font-semibold text-river-700">
              No booking fee. Pay in Indonesian rupiah.
            </p>
          </div>

          <div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {paymentMethods.map((method) => (
                <li key={method.label} className="rounded-xl bg-sand-50 p-4 ring-1 ring-sand-200">
                  <p className="text-sm font-semibold text-river-950">{method.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-river-700">{method.detail}</p>
                  {method.venueOnly ? (
                    <span className="mt-2 inline-block rounded-full bg-sand-100 px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide text-sand-900 uppercase">
                      Meet at venue only
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-white p-4 text-xs leading-relaxed text-river-800 ring-1 ring-river-100">
              <strong className="font-semibold text-river-950">Paying on arrival:</strong> cash at
              base camp is for trips where you drive to our starting point. Booked a hotel pickup?
              Payment is settled on WhatsApp before the driver leaves, by card, QRIS, e-wallet or
              PayPal.
            </p>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="relative overflow-hidden bg-river-700 pt-24 pb-28 text-white">
        <WaveDivider fill="white" position="top" />
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
              Your safety is our top priority
            </h2>
            <SplashUnderline className="text-sand-400" />
            <p className="mt-4 leading-relaxed text-river-50">
              Rafting is an adventure sport, and we run it like one: briefed, equipped and guided
              rather than improvised. If the river is not safe on the day, we cancel.
            </p>
            <a
              href={whatsappLink(
                `Hi ${siteConfig.name}, I have a question about safety on the rafting trip.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold tracking-wide text-river-800 uppercase transition-colors hover:bg-river-50"
            >
              Ask a safety question
            </a>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {safetyPoints.map((point) => (
              <li
                key={point}
                className="flex gap-2.5 rounded-xl bg-white/10 p-4 text-sm leading-relaxed ring-1 ring-white/15"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="mt-0.5 size-4 shrink-0 text-sand-300"
                  fill="currentColor"
                >
                  <path d="M8.2 13.9 4.3 10l1.4-1.4 2.5 2.5 5.1-5.1L14.7 7z" />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <WaveDivider fill="white" />
      </section>

      {/* Reviews — only with real guest quotes. */}
      {reviews.length > 0 ? (
        <section className="container-page pt-24 pb-8">
          <h2 className="text-center text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
            What our guests say
          </h2>
          <SplashUnderline className="mx-auto text-river-400" />
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {reviews.slice(0, 3).map((review) => (
              <li
                key={`${review.name}-${review.date}`}
                className="rounded-2xl bg-white p-6 ring-1 ring-river-100"
              >
                <p className="text-sm leading-relaxed text-river-900">“{review.quote}”</p>
                <p className="mt-4 text-xs font-semibold text-river-700">
                  {review.name} · {review.country}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Gallery preview — only when photos exist. */}
      {gallery.length > 0 ? (
        <section className="container-page py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
              On the river
            </h2>
            <Link
              href="/gallery"
              className="text-sm font-bold tracking-wide text-river-700 uppercase underline-offset-4 hover:underline"
            >
              See the gallery →
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.slice(0, 6).map((image) => (
              <li
                key={image.src}
                className="relative aspect-4/3 overflow-hidden rounded-2xl bg-river-100"
              >
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
      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
              Questions guests ask
            </h2>
            <SplashUnderline className="text-river-400" />
            <p className="mt-4 leading-relaxed text-river-800">
              Booking, payment, what to bring and what happens if it rains.
            </p>
            <Link
              href="/faq"
              className="mt-5 inline-flex text-sm font-bold tracking-wide text-river-700 uppercase underline-offset-4 hover:underline"
            >
              All questions and answers →
            </Link>
          </div>
          <FaqList items={homeFaqs} />
        </div>
      </section>

      {/* Closing CTA over a splash of water. */}
      <section className="container-page pb-4">
        <div className="relative isolate overflow-hidden rounded-3xl bg-river-900 px-6 py-16 text-center text-white sm:px-12">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--color-river-600),transparent_65%),radial-gradient(ellipse_at_bottom_left,var(--color-river-700),transparent_60%)]"
          />
          <Droplets className="mx-auto text-sand-300" />
          <h2 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
            Ready to book your rafting trip?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-river-100">
            Tell us the date and how many of you there are — we reply with availability and your
            pickup time, usually within a few minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={whatsappLink(`Hi ${siteConfig.name}, I would like to book a rafting trip.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-sand-400 px-7 py-3.5 text-sm font-bold tracking-wide text-river-950 uppercase transition-colors hover:bg-sand-300"
            >
              Message us on WhatsApp
            </a>
            <a
              href="#book"
              className="rounded-full border-2 border-white/35 px-6 py-3 text-sm font-bold tracking-wide uppercase transition-colors hover:bg-white/15"
            >
              Check availability
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
