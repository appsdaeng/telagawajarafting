/**
 * Photo storage for the gallery, backed by Supabase Storage.
 *
 * Uploads use the service-role key, which stays on the server; the bucket is
 * public so the site can link the objects directly. The key is optional: when it
 * is missing the gallery still accepts pasted image links.
 */

const BUCKET = "gallery";

/** Vercel rejects request bodies over ~4.5 MB, so leave room for the form parts. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export const ACCEPTED_IMAGE_TYPES = Object.keys(EXTENSIONS);

function serviceKey(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
}

/**
 * The project URL, from SUPABASE_URL when set. Otherwise derived from the
 * project ref that Supabase puts in the pooler username (`postgres.<ref>`),
 * so a project that already talks to the database needs no second variable.
 */
function projectUrl(): string {
  const explicit = (process.env.SUPABASE_URL ?? "").trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  try {
    const user = decodeURIComponent(new URL(process.env.DATABASE_URL ?? "").username);
    const ref = user.startsWith("postgres.") ? user.slice("postgres.".length) : "";
    if (/^[a-z]{20}$/.test(ref)) {
      return `https://${ref}.supabase.co`;
    }
  } catch {
    // DATABASE_URL is missing or not a URL yet.
  }

  return "";
}

export const storageConfigured = serviceKey().length > 0 && projectUrl().length > 0;

/** A failure the gallery page can show as-is. */
export class StorageError extends Error {}

function checkFile(file: File): string {
  const type = file.type.toLowerCase();
  const extension = EXTENSIONS[type];

  if (!extension) {
    throw new StorageError("Upload a JPG, PNG, WebP, AVIF or GIF image.");
  }

  if (file.size === 0) {
    throw new StorageError("That file is empty.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new StorageError("Keep each photo under 4 MB.");
  }

  return extension;
}

/** Uploads one photo and returns the public URL to store in gallery_images. */
export async function uploadImage(file: File): Promise<string> {
  const base = projectUrl();
  const key = serviceKey();

  if (!base || !key) {
    throw new StorageError(
      "Photo upload is turned off: add SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables. Pasting an image link still works.",
    );
  }

  const extension = checkFile(file);
  const type = file.type.toLowerCase();
  const now = new Date();
  const path = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    `${crypto.randomUUID()}.${extension}`,
  ].join("/");

  let response: Response;

  try {
    response = await fetch(`${base}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": type,
        "cache-control": "public, max-age=31536000, immutable",
        "x-upsert": "false",
      },
      body: await file.arrayBuffer(),
    });
  } catch (error) {
    console.error("[storage] upload request failed", error);
    throw new StorageError("Could not reach the photo store. Try again.");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[storage] upload rejected", response.status, detail.slice(0, 500));
    throw new StorageError(
      response.status === 401 || response.status === 403
        ? "The storage key was rejected. Check SUPABASE_SERVICE_ROLE_KEY in Vercel."
        : "The photo could not be uploaded. Try again.",
    );
  }

  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
