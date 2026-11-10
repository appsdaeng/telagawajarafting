import Link from "next/link";
import { siteConfig, whatsappLink } from "@/lib/tours";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/tours", label: "Rafting tours" },
  { href: "/gallery", label: "Gallery" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

/**
 * Two-tier header: a white bar with the logo and the phone/WhatsApp actions,
 * then a teal navigation strip — the layout guests expect from rafting sites in
 * Bali. The nav scrolls sideways on narrow phones instead of hiding behind a
 * JavaScript menu, so every page stays one tap away.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="bg-white">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5" aria-label={siteConfig.name}>
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-full bg-river-600 text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 15c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 4.5-2.5 6 0" strokeLinecap="round" />
                <path d="M2 20c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 4.5-2.5 6 0" strokeLinecap="round" />
                <path d="M12 12V4m0 0 3 2.5M12 4 9 6.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm leading-tight font-semibold tracking-tight whitespace-nowrap sm:text-base">
              Telaga Waja
              <span className="block text-[0.65rem] font-medium tracking-widest text-river-600 uppercase sm:text-[0.7rem]">
                Rafting
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={whatsappLink(`Hi ${siteConfig.name}, I would like to ask about rafting.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-river-200 px-4 py-2 text-sm font-semibold text-river-800 transition-colors hover:bg-river-50 sm:inline-flex"
            >
              Ask on WhatsApp
            </a>
            <a
              href={whatsappLink(`Hi ${siteConfig.name}, I would like to book a rafting trip.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-sand-400 px-4 py-2 text-xs font-bold tracking-wide text-river-950 uppercase transition-colors hover:bg-sand-300 sm:px-5 sm:text-sm"
            >
              Book now
            </a>
          </div>
        </div>
      </div>

      <nav aria-label="Main" className="bg-river-700 text-white">
        <div className="container-page flex h-11 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex items-center gap-0.5">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-2 py-1.5 text-[0.68rem] font-semibold tracking-wide whitespace-nowrap uppercase transition-colors hover:bg-white/15 sm:px-3 sm:text-[0.8rem]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
