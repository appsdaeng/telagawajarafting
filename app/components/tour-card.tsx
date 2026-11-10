import Image from "next/image";
import Link from "next/link";
import { hasPublicFile } from "@/lib/media";
import { formatRupiah, type Tour } from "@/lib/tours";

/**
 * Tour card used on the home page and the tours index.
 * "Book now" carries the tour into the booking widget on the home page.
 */
export function TourCard({ tour }: { tour: Tour }) {
  const hasImage = hasPublicFile(tour.image.src);

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-3xl border border-river-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-44 overflow-hidden bg-river-900">
        {hasImage ? (
          <Image
            src={tour.image.src}
            alt={tour.image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // No photo supplied yet: a water panel rather than an empty box.
          <div
            aria-hidden="true"
            className="size-full bg-[linear-gradient(135deg,var(--color-river-400),var(--color-river-900))]"
          >
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="absolute inset-x-0 bottom-0 h-2/3 w-full text-white/15"
              fill="currentColor"
            >
              <path d="M0 58c150 44 300 12 450-14s300-46 450-10 300 58 450 22 90-14 90-14v78H0Z" />
              <path
                opacity="0.75"
                d="M0 90c170 18 320-40 480-40s290 52 450 44 300-44 510-20v66H0Z"
              />
            </svg>
          </div>
        )}

        {tour.popular ? (
          <span className="absolute top-4 left-4 rounded-full bg-sand-400 px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-river-950 uppercase">
            Most popular
          </span>
        ) : null}

        <span className="absolute right-4 bottom-4 rounded-full bg-river-950/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {tour.duration}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold tracking-tight">
          <Link href={`/tours/${tour.slug}`} className="hover:text-river-700">
            {tour.name}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-river-800">{tour.tagline}</p>

        <ul className="mt-4 space-y-1.5 text-sm text-river-700">
          {tour.includes.slice(0, 3).map((item) => (
            <li key={item} className="flex gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="mt-0.5 size-4 shrink-0 text-river-500"
                fill="currentColor"
              >
                <path d="M8.2 13.9 4.3 10l1.4-1.4 2.5 2.5 5.1-5.1L14.7 7z" />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-river-100 pt-4">
          <p className="text-sm text-river-500">
            from
            <span className="mt-0.5 block text-base font-semibold text-river-950">
              {formatRupiah(tour.priceAdult)}
            </span>
            <span className="text-xs">per adult</span>
          </p>
          <Link
            href={{ pathname: "/", query: { tour: tour.slug }, hash: "book" }}
            className="rounded-full bg-river-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-river-700"
          >
            Book now
          </Link>
        </div>
      </div>
    </li>
  );
}
