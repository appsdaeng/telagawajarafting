import type { Metadata } from "next";
import { siteConfig, whatsappLink } from "@/lib/tours";

export const metadata: Metadata = {
  title: "Contact and location",
  description:
    "Contact Telaga Waja Rafting in Rendang, Karangasem, Bali. Bookings are confirmed on WhatsApp.",
};

export default function ContactPage() {
  return (
    <div className="container-page py-16 sm:py-20">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-widest text-river-500 uppercase">Contact</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Talk to us before you book
        </h1>
        <p className="mt-4 leading-relaxed text-river-800">
          WhatsApp is the fastest way to reach us — we reply with availability and your pickup
          time. There is no online payment: you pay at the counter on the day of your run.
        </p>
      </header>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl bg-river-950 p-8 text-white sm:p-10">
          <h2 className="text-xl font-semibold tracking-tight">Book on WhatsApp</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-river-200">
            Send us four things and we can confirm straight away: the tour you want, the date,
            how many adults and children, and where you are staying.
          </p>
          <a
            href={whatsappLink(
              `Hi ${siteConfig.name}, I would like to book a rafting trip. Tour: ___, date: ___, adults: ___, children: ___, hotel: ___`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-full bg-sand-400 px-6 py-3 text-sm font-semibold text-river-950 transition-colors hover:bg-sand-300"
          >
            Open WhatsApp
          </a>
        </div>

        <dl className="space-y-6 rounded-3xl border border-river-100 p-8">
          <div>
            <dt className="text-xs font-semibold tracking-widest text-river-500 uppercase">
              Base camp
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-river-900">
              {siteConfig.name}
              <br />
              {siteConfig.location}
              <br />
              Bali, Indonesia
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-widest text-river-500 uppercase">
              Opening hours
            </dt>
            <dd className="mt-2 text-sm text-river-900">Every day, 07:00 – 17:00</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-widest text-river-500 uppercase">
              Pickup areas
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-river-900">
              Ubud, Seminyak, Kuta, Sanur and Canggu. Other areas on request.
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-8 text-xs text-river-500">
        Address, phone number and opening hours are placeholders in this build. The admin portal
        replaces them from site settings before launch.
      </p>
    </div>
  );
}
