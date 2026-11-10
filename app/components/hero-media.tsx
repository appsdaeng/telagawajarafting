import Image from "next/image";
import { hasPublicFile } from "@/lib/media";

type HeroMediaProps = {
  /** Public path to an mp4, e.g. "/media/hero.mp4". Optional. */
  video?: string;
  /** Public path to a still, used as poster and as the fallback image. */
  image?: string;
  alt: string;
  /** Extra classes for the still, e.g. an object-position to steer the crop. */
  imageClassName?: string;
};

/**
 * Full-bleed hero background.
 *
 * The operator supplies the media, so every layer is optional: video if the
 * file exists, otherwise the still, otherwise a gradient. Nothing renders as a
 * broken image, and there is no request for a file that is not there.
 */
export function HeroMedia({ video, image, alt, imageClassName }: HeroMediaProps) {
  const hasVideo = hasPublicFile(video);
  const hasImage = hasPublicFile(image);

  if (hasVideo) {
    return (
      <video
        className="absolute inset-0 size-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={hasImage ? image : undefined}
        aria-label={alt}
      >
        <source src={video} type="video/mp4" />
      </video>
    );
  }

  if (hasImage) {
    return (
      <Image
        src={image!}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className={`object-cover ${imageClassName ?? ""}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-river-600),var(--color-river-950)_65%)]"
    />
  );
}
