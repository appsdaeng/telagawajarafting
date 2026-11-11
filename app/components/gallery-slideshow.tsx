"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryImage } from "@/lib/content";

type GallerySlideshowProps = {
  images: GalleryImage[];
  title?: string;
  eyebrow?: string;
};

/**
 * Slide-through gallery: three photos at a time on a wide screen, one at a
 * time on a phone, with previous/next arrows and swipe. Shows at most 15 photos
 * and links to the full gallery page, so the home page never turns into a wall
 * of images.
 */
export function GallerySlideshow({
  images,
  title = "Moment You Never Forget",
  eyebrow = "UNFORGETTABLE MOMENTS START HERE",
}: GallerySlideshowProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const slides = images.slice(0, 15);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateArrows();
    track.addEventListener("scroll", updateArrows, { passive: true });

    const observer = new ResizeObserver(updateArrows);
    observer.observe(track);

    return () => {
      track.removeEventListener("scroll", updateArrows);
      observer.disconnect();
    };
  }, [updateArrows, slides.length]);

  /** Move by exactly one card (plus the gap) so a slide is never cut in half. */
  const step = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 16;
    const distance = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  if (slides.length === 0) return null;

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
          onClick={() => step(-1)}
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
          onClick={() => step(1)}
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

        <ul
          ref={trackRef}
          aria-label="Gallery photos"
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 sm:-mx-6 sm:px-6 lg:gap-6"
        >
          {slides.map((image) => (
            <li
              key={image.src}
              className="relative aspect-4/3 w-[78vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-river-100 ring-1 ring-river-100 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/3)]"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                unoptimized
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 78vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
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
