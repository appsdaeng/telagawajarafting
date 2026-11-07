import Link from "next/link";
import { formatRupiah, siteConfig, tours, whatsappLink } from "@/lib/tours";

const reasons = [
  {
    title: "Guides who know the river",
    body: "Every raft runs with a trained, English-speaking guide who has done the descent hundreds of times.",
  },
  {
    title: "Real safety kit",
    body: "Helmets, life jackets and paddles checked before each run, with a safety briefing at base camp.",
  },
  {
    title: "Long, steady rapids",
    body: "14 km of Class II–III water — exciting for first-timers, still fun for people who have rafted before.",
  },
  {
    title: "Everything included",
    body: "Equipment, guide, lunch, hot shower and hotel transport. No surprises at the counter.",
  },
];

const steps = [
  { step: "01", title: "Pick a tour", body: "Compare the runs below, or ask us which suits your group." },
  { step: "02", title: "Message us", body: "Send the tour, date and number of people on WhatsApp." },
  { step: "03", title: "Confirm pickup", body: "We reply with availability and your pickup time." },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-river-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(63,184,189,0.35),transparent_60%)]"
        />
        <div className="relative container-page grid gap-12 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-river-400/40 bg-river-900/60 px-3 py-1 text-xs font-medium tracking-wide text-river-100">
              <span className="size-1.5 rounded-full bg-sand-400" aria-hidden="true" />
              Rendang, Karangasem · open daily
            </p>
            <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-balance-tight sm:text-5xl lg:text-6xl">
              Bali&apos;s longest rafting run, through the Telaga Waja valley.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-river-100 sm:text-lg">
              Fourteen kilometres of Class II–III rapids, jungle canyon and waterfalls — finishing
              with the drop everyone talks about. Two and a half hours on the water, and a hot
              shower and lunch waiting at the end.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={whatsappLink(`Hi ${siteConfig.name}, I would like to book a rafting trip.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-sand-400 px-6 py-3 text-sm font-semibold text-river-950 transition-colors hover:bg-sand-300"
              >
                Book on WhatsApp
              </a>
              <Link
                href="/tours"
                className="rounded-full border border-river-300/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-river-900"
              >
                See tours and prices
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { label: "On the water", value: "2.5–3h" },
              { label: "River distance", value: "14 km" },
              { label: "Rapids", value: "II–III" },
              { label: "Minimum age", value: "7 years" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-river-800 bg-river-900/50 p-5"
              >
                <dd className="text-2xl font-semibold tracking-tight text-white">{stat.value}</dd>
                <dt className="mt-1 text-xs tracking-widest text-river-300 uppercase">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Choose your run</h2>
            <p className="mt-3 max-w-xl text-river-800">
              Three ways to do the river. All prices are per person and include equipment, guide
              and lunch.
            </p>
          </div>
          <Link
            href="/tours"
            className="text-sm font-semibold text-river-600 underline-offset-4 hover:underline"
          >
            Compare all tours →
          </Link>
        </div>

        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {tours.map((tour) => (
            <li
              key={tour.slug}
              className="group flex flex-col overflow-hidden rounded-3xl border border-river-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                aria-hidden="true"
                className="h-36 bg-[linear-gradient(135deg,var(--color-river-500),var(--color-river-800))]"
              />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-semibold tracking-tight">{tour.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-river-800">{tour.tagline}</p>
                <p className="mt-5 text-sm text-river-500">
                  from <span className="text-base font-semibold text-river-950">{formatRupiah(tour.priceAdult)}</span> / adult
                </p>
                <Link
                  href={`/tours/${tour.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-river-600 group-hover:text-river-800"
                >
                  Tour details <span aria-hidden="true">→</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-river-50/70 py-20">
        <div className="container-page">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why people raft with us
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {reasons.map((reason) => (
              <li key={reason.title} className="rounded-2xl bg-white p-6 ring-1 ring-river-100">
                <h3 className="font-semibold tracking-tight">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-river-800">{reason.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How booking works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <li key={item.step} className="border-t-2 border-river-600 pt-5">
              <p className="text-xs font-semibold tracking-widest text-river-500">{item.step}</p>
              <h3 className="mt-2 font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-river-800">{item.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-river-600">
          No online payment — you pay at the counter on the day.
        </p>
      </section>
    </>
  );
}
