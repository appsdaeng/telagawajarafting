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
