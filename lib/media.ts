import { existsSync } from "node:fs";
import path from "node:path";

/**
 * True when a file exists under `public/`.
 *
 * Photography is supplied by the operator, so the build must not depend on a
 * file that may not exist yet. Components call this to decide between real
 * media and a gradient placeholder — no broken image icons, no layout shift.
 * Server-only: the filesystem is not reachable from the browser bundle.
 */
export function hasPublicFile(relativePath: string | undefined): boolean {
  if (!relativePath) {
    return false;
  }

  return existsSync(path.join(process.cwd(), "public", relativePath.replace(/^\//, "")));
}

/**
 * First candidate path that exists under `public/`, or `undefined`.
 *
 * Used where the operator may supply the same photo under either extension
 * (`.jpg` or `.jpeg`); the first one present wins.
 */
export function firstPublicFile(...candidates: string[]): string | undefined {
  return candidates.find((candidate) => hasPublicFile(candidate));
}

/** Hero still, accepting either JPEG extension the operator uploads. */
export const HERO_IMAGE_CANDIDATES = ["/media/hero.jpg", "/media/hero.jpeg"];
