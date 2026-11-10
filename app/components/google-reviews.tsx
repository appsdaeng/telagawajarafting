"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { GoogleMark } from "@/app/components/google-mark";
import { googleReviewSummary, googleReviews } from "@/lib/content";
import { siteConfig } from "@/lib/tours";

/** Gold stars, the way Google draws them. */
function Stars({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={`flex gap-0.5 ${className ?? ""}`}
      role="img"
      aria-label={`${count} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`size-3.5 ${index < count ? "text-[#FBBC05]" : "text-river-200"}`}
          fill="currentColor"
        >
          <path d="M10 1.6l2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L1.5 7.8l5.9-.9z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * The Google review strip under the booking bar: the listing card on the left,
 * a swipeable row of real reviews on the right. Every card links out to the
 * listing, because the full text and the ability to reply live on Google.
 */
export function GoogleReviews() {
  const track = useRef<HTMLUListElement>(null);
  const url = siteConfig.googleBusinessUrl;

  const scrollByCard = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className="mt-9 rounded-3xl bg-river-50 p-4 ring-1 ring-river-100 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
        {/* Listing summary */}
        <div className="flex shrink-0 items-start gap-4 lg:w-60 lg:flex-col">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-river-100 ring-1 ring-river-200">
            <Image
              src="/media/hero.jpeg"
              alt=""
              fill
              sizes="64px"
              className="object-cover object-[58%_36%]"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-river-950">
              {googleReviewSummary.name}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Stars count={5} />
              <span className="text-xs font-semibold text-river-700">
                {googleReviewSummary.total} Google reviews
              </span>
            </div>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-lg border border-river-300 bg-white px-3.5 py-2 text-xs font-bold tracking-wide text-river-800 uppercase transition-colors hover:bg-river-100"
              >
                Write a review
              </a>
            ) : null}
          </div>
        </div>

        {/* Review cards */}
        <div className="relative min-w-0 flex-1">
          <ul
            ref={track}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {googleReviews.map((review) => (
              <li
                key={`${review.name}-${review.when}`}
                className="w-[85%] shrink-0 snap-start sm:w-[55%] lg:w-[48%] xl:w-[40%]"
              >
                <a
                  href={url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-river-100 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-river-700 text-sm font-bold text-white uppercase"
                    >
                      {review.name.trim().charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-river-950">{review.name}</p>
                      <p className="text-xs text-river-600">{review.when}</p>
                    </div>
                    <GoogleMark className="size-5 shrink-0" />
                  </div>

                  <Stars count={review.rating} className="mt-3" />

                  <p
                    dir="auto"
                    className="mt-2.5 line-clamp-5 text-sm leading-relaxed text-river-800"
                  >
                    {review.quote}
                  </p>

                  <p className="mt-3 text-xs font-semibold text-river-600 group-hover:underline">
                    Read more on Google →
                  </p>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3 justify-between sm:gap-4">
            <p className="text-xs text-river-600">
              Swipe for more · tap a review to read it on Google
            </p>
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 rounded-full bg-sand-300 px-4 py-2 text-xs font-bold tracking-wide text-river-950 uppercase transition-colors hover:bg-sand-400"
            >
              Book Now!
              <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="currentColor">
                <path d="M6.5 4l8 8-2.3 1.8-3.5-3.5a.6.6 0 010-.9L12 5.4l-4.5 4 1.8 2.3-7-7z" />
              </svg>
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                aria-label="Previous reviews"
                className="grid size-9 place-items-center rounded-full border border-river-200 bg-white text-river-800 transition-colors hover:bg-river-100"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="currentColor">
                  <path d="M12.7 4.3 7 10l5.7 5.7 1.4-1.4L9.8 10l4.3-4.3z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                aria-label="More reviews"
                className="grid size-9 place-items-center rounded-full border border-river-200 bg-white text-river-800 transition-colors hover:bg-river-100"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="currentColor">
                  <path d="M7.3 4.3 6 5.7 10.2 10 6 14.3l1.3 1.4L13 10z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
