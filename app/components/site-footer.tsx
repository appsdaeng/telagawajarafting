import Link from "next/link";
import { siteConfig, whatsappLink } from "@/lib/tours";

// Evaluated once when the module loads, not during render: Cache Components
// rejects reading the clock mid-render because it would break prerendering.
const copyrightYear = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-river-900/40 bg-river-950 text-river-100">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div className="max-w-sm">
          <p className="text-lg font-semibold text-white">{siteConfig.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-river-200">
            White water rafting on the Telaga Waja river in {siteConfig.location}. Rain or
            shine, every day of the year.
          </p>
        </div>

        <nav aria-label="Footer" className="text-sm">
          <p className="font-semibold tracking-widest text-river-400 uppercase">Explore</p>
          <ul className="mt-4 space-y-2.5">
            <li><Link href="/" className="hover:text-white">Home</Link></li>
            <li><Link href="/tours" className="hover:text-white">Tours and prices</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact and location</Link></li>
          </ul>
        </nav>

        <div className="text-sm">
          <p className="font-semibold tracking-widest text-river-400 uppercase">Booking</p>
          <p className="mt-4 text-river-200">
            Bookings are confirmed on WhatsApp. Tell us the tour, the date and how many
            people, and we will reply with availability.
          </p>
          <a
            href={whatsappLink(`Hi ${siteConfig.name}, I would like to book a rafting trip.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sand-400 px-4 py-2 font-semibold text-river-950 transition-colors hover:bg-sand-300"
          >
            Message us on WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-river-900/60">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-river-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {copyrightYear} {siteConfig.name}. All rights reserved.</p>
          <p>
            Prices and contact details shown are placeholders for the build phase and are
            replaced from the admin portal before launch.
          </p>
        </div>
      </div>
    </footer>
  );
}
