"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { GalleryImage } from "@/lib/content";

type GallerySlideshowProps = {
  images: GalleryImage[];
  title?: string;
  eyebrow?: string;
};

/**
 * Paged gallery: three photos per page on a wide screen, two on a tablet and
 * one on a phone. The previous/next arrows move a whole page — there is no
 * scrolling strip and no scrollbar. Shows at most 15 photos and links to the
 * full gallery page, so the home page never turns into a wall of images.
 */
export function GallerySlideshow({
  images,
  title = "Moment You Never Forget",
  eyebrow = "UNFORGETTABLE MOMENTS START HERE",
}: GallerySlideshowProps) {
  const [perPage, setPerPage] = useState(3);
  const [page, setPage] = useState(0);

  const slides = images.slice(0, 15);

  // Match the Tailwind breakpoints used for the card widths below.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const medium = window.matchMedia("(min-width: 640px)");

    const sync = () => setPerPage(wide.matches ? 3 : medium.matches ? 2 : 1);

    sync();
    wide.addEventListener("change", sync);
    medium.addEventListener("change", sync);

    return () => {
      wide.removeEventListener("change", sync);
      medium.removeEventListener("change", sync);
    };
  }, []);

  const pages: GalleryImage[][] = [];
  for (let start = 0; start < slides.length; start += perPage) {
    pages.push(slides.slice(start, start + perPage));
  }

  const pageCount = pages.length;

  // A narrower window means more pages; never stay on a page that is gone.
  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  if (slides.length === 0 || pageCount === 0) return null;

  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  const arrowClass =
    "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-river-800 shadow-md ring-1 ring-river-100 transition disabled:cursor-default disabled:opacity-0 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river-600";

  return (
    <section aria-labelledby="gallery-slideshow-heading" className="container-page py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-river-600 uppercase">{eyebrow}</p>
        <h2
          id="gallery-slideshow-heading"
          className="mt-3 text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl"
        >
          {title}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-river-800 sm:text-base">
          Feel the excitement, conquer the rapids, and discover the natural beauty of Telaga Waja
          River. Enjoy thrilling white-water rafting, easy river access, and unforgettable moments
          with your loved ones. Your Bali adventure starts here!
        </p>
      </div>

      <div className="relative mt-10">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(0, current - 1))}
          disabled={!canPrev}
          aria-label="Previous photos"
          className={`${arrowClass} -left-2 sm:-left-4`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
          disabled={!canNext}
          aria-label="Next photos"
          className={`${arrowClass} -right-2 sm:-right-4`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {pages.map((group, pageIndex) => (
              <ul
                key={`page-${pageIndex}`}
                aria-label={pageIndex === 0 ? "Gallery photos" : undefined}
                aria-hidden={pageIndex !== page}
                className="flex w-full shrink-0 gap-4 lg:gap-6"
              >
                {group.map((image) => (
                  <li
                    key={image.src}
                    className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-2xl bg-river-100 ring-1 ring-river-100 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 rounded-full bg-river-700 px-6 py-3 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-river-800"
        >
          View all
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 10h10M12 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
