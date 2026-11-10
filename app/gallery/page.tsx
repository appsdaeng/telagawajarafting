import Link from "next/link";
import { JsonLd } from "@/app/components/json-ld";
import { GalleryStrip } from "@/app/components/gallery-strip";
import { galleryHeroImage } from "@/lib/content";
import { getGalleryImages } from "@/lib/gallery";

export const metadata = {
  title: "Gallery",
  description: "Moments from the Telaga Waja river in Bali, uploaded by the operator.",
};

export default async function GalleryPage() {
  const gallery = await getGalleryImages();
  const section = {
    title: "Moment You Never Forget",
    subtitle: "Slide image: max 15, each linking to the gallery page",
    heroImage: galleryHeroImage,
    images: gallery,
  };

  return (
    <div className="container-page py-16 sm:py-20">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ImageGallery", name: "Telaga Waja Rafting Gallery" }} />

      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-river-700 uppercase hover:underline"
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 12l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to home
      </Link>

      {gallery.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-river-200 bg-river-50 p-10 text-center">
          <h2 className="text-2xl font-semibold text-river-900">Moment You Never Forget</h2>
          <p className="mt-3 text-river-700">
            Slide image: max 15, each linking to the gallery page.
          </p>
          <p className="mt-4 text-river-600">
            Photos will appear here once the operator uploads them to the gallery folder.
          </p>
        </div>
      ) : (
        <GalleryStrip section={section} />
      )}
    </div>
  );
}
