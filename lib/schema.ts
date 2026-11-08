import type { Faq } from "@/lib/content";
import type { Tour } from "@/lib/tours";
import { formatRupiah, siteConfig, tours } from "@/lib/tours";
import { hasPublicFile } from "@/lib/media";

/**
 * schema.org / JSON-LD builders.
 *
 * Everything here must describe the business truthfully: no invented ratings,
 * no invented review counts, no prices that are not on the page. Google's Rich
 * Results Test is the check that matters, and fake review markup is a penalty
 * risk rather than a shortcut.
 */

function absolute(pathOrUrl: string): string {
  return new URL(pathOrUrl, siteConfig.siteUrl).toString();
}

function postalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: siteConfig.streetAddress,
    addressLocality: siteConfig.addressLocality,
    addressRegion: siteConfig.addressRegion,
    postalCode: siteConfig.postalCode,
    addressCountry: siteConfig.country,
  };
}

const description =
  "White water rafting on the Telaga Waja river in Karangasem, Bali. 14 km of Class II–III rapids with guide, equipment, lunch and hotel pickup included.";

/** LocalBusiness + TouristAttraction for the home page. */
export function businessJsonLd() {
  const cheapest = Math.min(...tours.map((tour) => tour.priceAdult));

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "TouristAttraction"],
    "@id": `${siteConfig.siteUrl}/#business`,
    name: siteConfig.name,
    description,
    url: siteConfig.siteUrl,
    telephone: `+${siteConfig.whatsappNumber}`,
    address: postalAddress(),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "07:00",
        closes: "17:00",
      },
    ],
    areaServed: [
      "Ubud",
      "Seminyak",
      "Kuta",
      "Sanur",
      "Canggu",
      "Karangasem",
      "Bali",
    ],
    priceRange: `From ${formatRupiah(cheapest)}`,
    currenciesAccepted: "IDR",
    paymentAccepted: "Cash, Credit Card",
    ...(hasPublicFile("/media/hero.jpg") ? { image: absolute("/media/hero.jpg") } : {}),
  };
}

/** A single tour as a bookable TouristTrip with an Offer. */
export function tourJsonLd(tour: Tour) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.name,
    description: tour.description,
    url: absolute(`/tours/${tour.slug}`),
    touristType: ["Families", "Adventure travellers", "First-time rafters"],
    provider: {
      "@type": "LocalBusiness",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
      telephone: `+${siteConfig.whatsappNumber}`,
      address: postalAddress(),
    },
    ...(hasPublicFile(tour.image.src) ? { image: absolute(tour.image.src) } : {}),
    offers: {
      "@type": "Offer",
      url: absolute(`/tours/${tour.slug}`),
      price: tour.priceAdult,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      // Payment is taken at base camp, so there is no checkout URL to point at.
      category: "Per person",
    },
    itinerary: {
      "@type": "ItemList",
      itemListElement: tour.highlights.map((highlight, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: highlight,
      })),
    },
  };
}

/** BreadcrumbList for a page that sits below the root. */
export function breadcrumbJsonLd(
  crumbs: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

/** FAQPage — only ever generated from the visible FAQ copy on the page. */
export function faqJsonLd(items: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
