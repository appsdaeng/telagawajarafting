import Image from "next/image";
import Link from "next/link";
import type { GalleryImage } from "@/lib/content";

type GallerySlideshowProps = {
  images: GalleryImage[];
  title?: string;
  eyebrow?: string;
};

/**
 * Slide-through gallery strip. Shows at most 15 photos and links to the full
 * gallery page, so the home page never turns into a wall of images.
 */
export function GallerySlideshow({
  images,
  title = "Moment You Never Forget",
  eyebrow = "Good Words",
}: GallerySlideshowProps) {
  if (images.length === 0) return null;

  const slides = images.slice(0, 15);

  return (
    <section aria-labelledby="gallery-slideshow-heading" className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-river-600 uppercase">{eyebrow}</p>
        <h2
          id="gallery-slideshow-heading"
          className="mt-3 text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl"
        >
          {title}
        </h2>
        <p className="mt-4 text-sm text-river-800">Slide through moments from the river.</p>
      </div>

      <ul
        aria-label="Gallery photos"
        className="-mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 sm:-mx-6 sm:px-6"
      >
        {slides.map((image) => (
          <li
            key={image.src}
            className="relative aspect-4/3 w-[78vw] max-w-sm shrink-0 snap-start overflow-hidden rounded-2xl bg-river-100 ring-1 ring-river-100 sm:w-80"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              unoptimized
              sizes="(min-width: 640px) 20rem, 78vw"
              className="object-cover"
            />
          </li>
        ))}
      </ul>

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
