import Link from "next/link";
import { tours, whatsappLink, siteConfig } from "@/lib/tours";

export default function NotFound() {
  return (
    <div className="container-page py-20 sm:py-28">
      <p className="text-xs font-semibold tracking-widest text-river-500 uppercase">Error 404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        That page went down the river
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-river-800">
        The page you asked for does not exist — it may have been renamed, or the link may have a
        typo. Here is where most people are heading:
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-full bg-river-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-river-700"
        >
          Home
        </Link>
        <Link
          href="/tours"
          className="rounded-full border border-river-300 px-5 py-2.5 text-sm font-semibold text-river-800 transition-colors hover:bg-river-50"
        >
          Tours and prices
        </Link>
        <Link
          href="/faq"
          className="rounded-full border border-river-300 px-5 py-2.5 text-sm font-semibold text-river-800 transition-colors hover:bg-river-50"
        >
          FAQ
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-river-300 px-5 py-2.5 text-sm font-semibold text-river-800 transition-colors hover:bg-river-50"
        >
          Contact
        </Link>
      </div>

      <div className="mt-12 border-t border-river-100 pt-8">
        <h2 className="text-sm font-semibold tracking-widest text-river-500 uppercase">
          Popular tours
        </h2>
        <ul className="mt-4 space-y-2">
          {tours.map((tour) => (
            <li key={tour.slug}>
              <Link
                href={`/tours/${tour.slug}`}
                className="text-river-700 underline-offset-4 hover:text-river-950 hover:underline"
              >
                {tour.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-river-600">
          Need help now?{" "}
          <a
            href={whatsappLink(`Hi ${siteConfig.name}, I could not find a page on your website.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-river-700 underline underline-offset-4"
          >
            Message us on WhatsApp
          </a>
          .
        </p>
      </div>
    </div>
  );
}
