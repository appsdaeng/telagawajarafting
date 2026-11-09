import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/app/components/faq-list";
import { JsonLd } from "@/app/components/json-ld";
import { faqs } from "@/lib/content";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { siteConfig, whatsappLink } from "@/lib/tours";

export const metadata: Metadata = {
  title: "Rafting FAQ: Booking, Payment, Refunds",
  description:
    "How to book Telaga Waja rafting, how payment works, cancellation policy, what to bring and whether you need to swim. Straight answers before you book.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "FAQ", path: "/faq" },
  ];

  return (
    <div className="container-page py-16 sm:py-20">
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <nav aria-label="Breadcrumb" className="text-sm text-river-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-river-900 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-river-900">
            FAQ
          </li>
        </ol>
      </nav>

      <header className="mt-6 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Telaga Waja rafting: questions and answers
        </h1>
        <p className="mt-4 leading-relaxed text-river-800">
          Everything guests ask before booking — payment, cancellation, what to bring and what
          happens when it rains. If your question is not here, message us and we will answer it.
        </p>
      </header>

      <div className="mt-10 max-w-3xl">
        <FaqList items={faqs} />
      </div>

      <div className="mt-10 rounded-3xl bg-river-50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">Still not sure?</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-river-800">
          Tell us your dates and group and we will recommend the right run — including whether an
          early start or a private raft is worth it for you.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={whatsappLink(`Hi ${siteConfig.name}, I have a question about the rafting trip.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-river-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-river-700"
          >
            Ask on WhatsApp
          </a>
          <Link
            href="/tours"
            className="rounded-full border border-river-300 px-5 py-2.5 text-sm font-semibold text-river-800 transition-colors hover:bg-white"
          >
            See tours and prices
          </Link>
        </div>
      </div>
    </div>
  );
}
