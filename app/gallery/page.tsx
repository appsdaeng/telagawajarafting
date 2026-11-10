import Link from "next/link";
import { JsonLd } from "@/app/components/json-ld";
import { GalleryStrip } from "@/app/components/gallery-strip";
import { gallerySection } from "@/lib/content";

export const metadata = {
  title: "Telaga Waja Rafting - Moments You'll Never Forget",
  description: "Create moments you'll never forget with Telaga Waja Rafting Bali! Enjoy thrilling rapids, stunning scenery, and easy access with no stairs. Book now!.",
};

export default function GalleryPage() {
  return (
    <div className="container-page py-16 sm:py-20">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ImageGallery", name: "Telaga Waja Rafting Gallery" }} />

      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-river-700 uppercase hover:underline">
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 12l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to home
      </Link>

      <GalleryStrip section={gallerySection} />
    </div>
  );
}
