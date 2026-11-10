import Image from "next/image";
import Link from "next/link";
import { GallerySection } from "@/lib/content";

type GalleryStripProps = {
  section: GallerySection;
};

export function GalleryStrip({ section: { images } }: GalleryStripProps) {

  return (
    <section className="container-page pb-16 pt-14 sm:pt-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-river-600 uppercase">Good Words</p>
        <h2 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight uppercase sm:text-4xl">
          Moment You Never Forget
        </h2>
        <p className="mt-4 text-sm text-river-800">Slide through moments from the river.</p>
      </div>

      <div className="mt-10 relative overflow-hidden rounded-3xl bg-river-50 p-6 sm:p-10">
        <div className="mx-auto max-w-none overflow-hidden">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {images.slice(0, 15).map((image, index) => (
              <div key={image.src} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-river-100">
                <div className="relative aspect-16/10 overflow-hidden">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    unoptimized
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="px-4 pb-4 pt-2 text-center text-xs font-semibold text-river-700 uppercase">
                  {index + 1}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-full bg-river-700 px-6 py-3 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-river-800"
          >
            View all
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 10h10M12 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
