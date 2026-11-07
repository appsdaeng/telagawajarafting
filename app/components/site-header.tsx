import Link from "next/link";
import { siteConfig, whatsappLink } from "@/lib/tours";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/tours", label: "Tours" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-river-100 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={siteConfig.name}>
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-river-600 text-white"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 15c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 4.5-2.5 6 0" strokeLinecap="round" />
              <path d="M2 20c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 4.5-2.5 6 0" strokeLinecap="round" />
              <path d="M12 12V4m0 0 3 2.5M12 4 9 6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm leading-tight font-semibold tracking-tight sm:text-base">
            Telaga Waja
            <span className="block text-[0.7rem] font-medium tracking-widest text-river-600 uppercase">
              Rafting
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-river-800 transition-colors hover:bg-river-50 hover:text-river-950"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={whatsappLink(`Hi ${siteConfig.name}, I would like to ask about rafting.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 rounded-full bg-river-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-river-700"
          >
            Book now
          </a>
        </nav>
      </div>
    </header>
  );
}
