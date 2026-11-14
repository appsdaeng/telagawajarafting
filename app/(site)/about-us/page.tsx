import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/app/components/faq-list";
import type { Faq } from "@/lib/content";
import { siteConfig, whatsappLink } from "@/lib/tours";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Telaga Waja Adventure (TWA) Rafting — white water rafting on the Telaga Waja River in Karangasem, Bali. Our story, mission, safety standards and the day you can expect.",
  alternates: { canonical: "/about-us" },
};

const stats = [
  { value: "20+", label: "Years of Experience", copy: "Two decades of guiding guests down Bali’s rivers." },
  { value: "16 km", label: "Rafting Route", copy: "Bali’s longest white water rafting descent." },
  { value: "4.9/5", label: "Guest Rating", copy: "Based on 120+ reviews from travellers worldwide." },
  { value: "100%", label: "Local Team", copy: "Professional guides who know every rapid." },
];

const special = [
  {
    icon: "🚣",
    title: "Premium White Water Rafting",
    body: "Experience the famous Telaga Waja River, one of Bali’s longest and most exciting rafting destinations, featuring crystal-clear water, thrilling rapids, lush rainforest, waterfalls and spectacular mountain scenery.",
  },
  {
    icon: "🚶",
    title: "No Long Stair Access",
    body: "Unlike many rafting destinations in Bali that require climbing hundreds of stairs, Telaga Waja Rafting offers easy, no-stair river access, making your adventure more comfortable from the very beginning. Spend less time walking and more time enjoying the thrill — ideal for families, beginners and seniors.",
  },
  {
    icon: "🛡️",
    title: "Safety Comes First",
    body: "Your safety is our highest priority. Every tour includes professional guides, comprehensive safety briefings, high-quality helmets, life jackets and internationally recognised safety procedures.",
  },
  {
    icon: "🌿",
    title: "Authentic Bali Experience",
    body: "Our adventures take you beyond the typical tourist attractions, allowing you to discover Bali’s natural beauty, local villages, rivers and tropical landscapes.",
  },
  {
    icon: "⭐",
    title: "Professional Local Team",
    body: "Our friendly and experienced team is passionate about providing excellent customer service from your first enquiry until the end of your adventure.",
  },
];

const steps = [
  {
    title: "Welcome & skip the line",
    copy: "Arrive at the start point with a warm welcome and an efficient check-in. Guests with advance reservations enjoy priority check-in, so you spend less time waiting and more time preparing for Bali’s longest and most exciting white water rafting adventure.",
  },
  {
    title: "Registration & safety briefing",
    copy: "Meet your professional rafting guide for a comprehensive safety briefing. Learn basic paddling techniques, river commands and important safety procedures before heading to the river.",
  },
  {
    title: "Start without the long stair",
    copy: "Unlike many rafting locations in Bali, our easy no-stair river access lets you reach the launch point comfortably, saving your energy for the exciting rapids ahead.",
  },
  {
    title: "Conquer Bali’s longest route",
    copy: "Paddle approximately 16 km through the stunning Telaga Waja River, navigating exciting Class II–III rapids, crystal-clear water, lush rainforest, natural waterfalls, dramatic cliffs and the famous dam drop.",
  },
  {
    title: "Enjoy every scenic moment",
    copy: "Take in breathtaking views and capture unforgettable photos as you raft through one of Bali’s most beautiful river valleys.",
  },
  {
    title: "Celebrate your achievement",
    copy: "Reach the finish point with a sense of accomplishment after completing one of Bali’s most exciting white water rafting experiences.",
  },
  {
    title: "Shower, change & lunch",
    copy: "Freshen up with clean shower facilities, changing rooms, towels and lockers before enjoying your well-earned meal.",
  },
];

const faqs: Faq[] = [
  {
    question: "How long is the Telaga Waja rafting experience?",
    answer:
      "The rafting adventure lasts approximately 2.5–3 hours on the river, covering a scenic route of around 16–18 km. Including registration, the safety briefing, lunch and optional hotel transfers, the whole experience usually takes 5–7 hours.",
  },
  {
    question: "Is rafting safe?",
    answer:
      "Yes. Safety is our highest priority. Every guest receives a certified safety helmet, an international-standard life jacket, a professional rafting guide, a complete safety briefing and insurance coverage subject to the operator’s terms.",
  },
  {
    question: "Is Telaga Waja Rafting suitable for beginners?",
    answer:
      "Yes. The Telaga Waja River has Class II–III rapids, which makes it suitable for beginners, families, couples and experienced rafters. A professional guide gives a full safety briefing before every trip.",
  },
  {
    question: "Do I need previous rafting experience?",
    answer:
      "No prior experience is needed. Your guide explains the paddling techniques, safety procedures and teamwork before the trip begins.",
  },
  {
    question: "What should I bring for rafting?",
    answer:
      "Bring comfortable quick-dry clothing, water shoes or sandals, a change of clothes, sunscreen, sunglasses with a secure strap, a waterproof or action camera and some cash for personal expenses.",
  },
];

export default function AboutUsPage() {
  return (
    <div>
      {/* Title and intro */}
      <section className="container-page pt-14 sm:pt-20">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <header>
            <p className="text-xs font-semibold tracking-widest text-river-500 uppercase">
              About Us
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              The adrenaline rush through unparalleled river rapids
            </h1>
            <p className="mt-5 leading-relaxed text-river-800">
              Experience the thrill of <strong>Bali rafting</strong>, one of the island’s most
              popular outdoor adventures. Paddle through lush tropical rainforests, dramatic
              cliffs, cascading waterfalls and exciting Class II–IV rapids while discovering Bali’s
              untouched natural beauty.
            </p>
            <p className="mt-4 leading-relaxed text-river-800">
              We are the official start point of Telaga Waja White Water Rafting in Bali, where
              guests begin their river adventure with professional guides and complete safety
              equipment.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/tours"
                className="rounded-full bg-river-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-river-700"
              >
                See our tours
              </Link>
              <a
                href={whatsappLink(`Hi ${siteConfig.name}, I would like to ask about rafting.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-river-300 px-6 py-3 text-sm font-semibold text-river-800 transition-colors hover:bg-river-50"
              >
                Ask on WhatsApp
              </a>
            </div>
          </header>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/hero.jpeg"
            alt="Rafting guests on the Telaga Waja River in Karangasem, Bali"
            className="aspect-[4/3] w-full rounded-3xl object-cover"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="container-page mt-14">
        <dl className="grid gap-6 rounded-3xl bg-river-950 px-6 py-8 text-white sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-3xl font-semibold tracking-tight">{stat.value}</dt>
              <dd>
                <span className="mt-1 block text-sm font-semibold text-sand-300">{stat.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-river-200">
                  {stat.copy}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* What makes us special */}
      <section className="container-page mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">What makes us special?</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-river-800">
          Your adventure begins here — with the river, the guides and the details that turn a boat
          trip into the highlight of your holiday.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {special.map((item) => (
            <article key={item.title} className="rounded-3xl border border-river-100 p-6">
              <span aria-hidden="true" className="text-2xl">
                {item.icon}
              </span>
              <h3 className="mt-3 text-base font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-river-800">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Who we are */}
      <section className="container-page mt-16">
        <div className="rounded-3xl bg-river-50 p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">Who we are</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-river-800">
            Experience the best of Bali with Telaga Waja Adventure Rafting. We specialise in
            world-class rafting and ATV adventures, combining breathtaking scenery, professional
            guides and exceptional service for an unforgettable journey.
          </p>
        </div>
      </section>

      {/* About, mission, vision, story */}
      <section className="container-page mt-16 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">About us</h2>
          <p className="mt-4 font-semibold text-river-950">
            Welcome to Telaga Waja Adventure — your trusted adventure partner in Bali
          </p>
          <p className="mt-3 leading-relaxed text-river-800">
            Welcome to <strong>Telaga Waja Adventure Rafting</strong>, your trusted destination for
            unforgettable outdoor adventures in Bali. We specialise in delivering exciting{" "}
            <strong>Telaga Waja white water rafting</strong>, <strong>Ayung River rafting</strong>,{" "}
            <strong>ATV quad bike tours</strong> and other adventure experiences that showcase the
            island’s breathtaking natural beauty.
          </p>
          <p className="mt-3 leading-relaxed text-river-800">
            Whether you are travelling with family, friends, your partner or a corporate group, our
            goal is to provide a safe, fun and memorable adventure for every guest.
          </p>

          <div className="mt-8">
            <h3 className="text-lg font-semibold tracking-tight">Our story</h3>
            <p className="mt-3 leading-relaxed text-river-800">
              Telaga Waja Adventure Rafting was founded with a simple mission: to share the
              excitement of Bali’s rivers and landscapes while maintaining the highest standards of
              safety, professionalism and customer service.
            </p>
            <p className="mt-3 leading-relaxed text-river-800">
              Over the years we have welcomed travellers from around the world, helping them
              discover Bali beyond its beaches through thrilling rafting trips, scenic ATV rides and
              unforgettable outdoor experiences.
            </p>
            <p className="mt-3 leading-relaxed text-river-800">
              Every adventure is carefully planned and guided by experienced local professionals who
              know Bali’s rivers, jungles and countryside inside and out.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <article className="rounded-3xl border border-river-100 p-6">
            <h3 className="text-base font-semibold tracking-tight">Our mission</h3>
            <p className="mt-2 text-sm leading-relaxed text-river-800">
              To provide world-class adventure experiences that combine excitement, safety,
              environmental responsibility and authentic Balinese hospitality. We are committed to
              creating unforgettable memories while helping visitors experience the natural beauty
              and cultural richness of Bali.
            </p>
          </article>

          <article className="rounded-3xl border border-river-100 p-6">
            <h3 className="text-base font-semibold tracking-tight">Our vision</h3>
            <p className="mt-2 text-sm leading-relaxed text-river-800">
              To become one of Bali’s most trusted and recommended adventure tour operators by
              consistently delivering exceptional service, professional guidance and unforgettable
              outdoor experiences.
            </p>
          </article>

          <article className="rounded-3xl bg-river-950 p-6 text-white">
            <p className="text-xs font-semibold tracking-widest text-sand-300 uppercase">
              Trusted traveller
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">Awesome</p>
            <p className="mt-1 text-lg font-semibold text-sand-300">4.9/5</p>
            <p className="mt-1 text-xs text-river-200">Based on 120+ reviews</p>
          </article>
        </div>
      </section>

      {/* The day, step by step */}
      <section className="container-page mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          Through unparalleled river rapids
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-river-800">
          Create incredible memories with Bali’s ultimate thrilling adventure — this is how the day
          runs, from the welcome at the start point to the shower and lunch at the finish.
        </p>

        <ol className="mt-8 grid gap-5 sm:grid-cols-2">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-3xl border border-river-100 p-6 transition-colors hover:border-river-300"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-river-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-river-800">{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="container-page mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-river-800">
          Plan your adventure with confidence. These are the questions guests ask us most about the
          river, the safety equipment and what to bring.
        </p>
        <div className="mt-6">
          <FaqList items={faqs} />
        </div>
        <Link
          href="/faq"
          className="mt-6 inline-flex text-sm font-semibold text-river-700 underline hover:text-river-900"
        >
          Read all our FAQs
        </Link>
      </section>

      {/* CTA */}
      <section className="container-page mt-16 mb-4">
        <div className="rounded-3xl bg-river-950 px-6 py-10 text-center text-white sm:px-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready for Bali’s longest rafting route?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-river-200">
            Pick a date, choose your option and book online — or message us and we will help you
            plan the day.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/tours"
              className="rounded-full bg-sand-400 px-6 py-3 text-sm font-semibold text-river-950 transition-colors hover:bg-sand-300"
            >
              Book now
            </Link>
            <a
              href={whatsappLink(`Hi ${siteConfig.name}, I would like to book a rafting trip.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
