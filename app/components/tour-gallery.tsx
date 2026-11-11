"use client";

import Image from "next/image";
import { useState } from "react";
import type { TourPhoto } from "@/lib/tour-photo";

/**
 * The tour banner with arrows through the operator's photos.
 *
 * The first photo is the cover: it is also what the tour cards and the social
 * share image use. Arrow buttons, the counter and the thumbnail strip only
 * appear when the tour has more than one photo.
 */
export function TourGallery({ images }: { images: TourPhoto[] }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const safeIndex = Math.min(index, images.length - 1);
  const current = images[safeIndex];
  const multiple = images.length > 1;
  const go = (step: number) => setIndex((safeIndex + step + images.length) % images.length);

  return (
    <div
      className="group relative h-[400px] w-full overflow-hidden bg-river-100 sm:h-[600px] lg:h-[900px]"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(1);
        if (event.key === "ArrowLeft") go(-1);
      }}
      tabIndex={-1}
    >
      <Image
        key={current.src}
        src={current.src}
        alt={current.alt}
        fill
        priority
        // Uploaded photos live on Supabase Storage, so skip the optimizer
        // rather than allowlisting the operator's host at build time.
        unoptimized
        sizes="100vw"
        className="object-cover"
      />

      {multiple ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-river-900 shadow-md backdrop-blur transition-colors hover:bg-white sm:left-5 sm:size-12"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-river-900 shadow-md backdrop-blur transition-colors hover:bg-white sm:right-5 sm:size-12"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <p className="absolute top-4 right-4 rounded-full bg-river-950/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {safeIndex + 1} / {images.length}
          </p>

          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-[linear-gradient(to_top,rgba(8,38,43,0.65),transparent)] p-4">
            {images.map((photo, i) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === safeIndex}
                className={`relative size-14 overflow-hidden rounded-lg ring-2 transition-opacity sm:size-16 ${
                  i === safeIndex ? "ring-white" : "ring-white/40 opacity-75 hover:opacity-100"
                }`}
              >
                <Image src={photo.src} alt="" fill unoptimized sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
