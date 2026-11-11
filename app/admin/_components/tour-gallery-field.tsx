"use client";

import { useRef, useState } from "react";
import { buttonSecondary, inputClass, labelClass } from "@/app/admin/_components/ui";

type TourGalleryFieldProps = {
  coverDefault?: string | null;
  galleryDefault?: string[] | null;
  /** Why device uploads cannot run yet, when storage is not configured. */
  uploadHint?: string | null;
};

/**
 * Photos for a tour: upload or paste several, then choose the cover.
 *
 * The cover is posted as `image_url` and is what the public site uses for the
 * tour card, the banner and the social image. Every other photo is posted as a
 * JSON array in `gallery_urls` and appears behind the gallery arrows.
 */
export function TourGalleryField({
  coverDefault,
  galleryDefault,
  uploadHint,
}: TourGalleryFieldProps) {
  const [photos, setPhotos] = useState<string[]>(() => {
    const all = [coverDefault ?? "", ...(galleryDefault ?? [])]
      .map((value) => value.trim())
      .filter(Boolean);
    return [...new Set(all)];
  });
  const [cover, setCover] = useState((coverDefault ?? "").trim());
  const [urlInput, setUrlInput] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const addPhoto = (url: string) => {
    const src = url.trim();
    if (!src) return;
    setPhotos((current) => (current.includes(src) ? current : [...current, src]));
    setCover((current) => current || src);
  };

  const removePhoto = (url: string) => {
    setPhotos((current) => current.filter((photo) => photo !== url));
    setCover((current) => (current === url ? "" : current));
  };

  const upload = async () => {
    const file = fileInput.current?.files?.[0];

    if (!file) {
      setError("Choose a photo from your device first.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/admin/api/tours/upload", { method: "POST", body });
      const result = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !result.url) {
        setError(result.error ?? "The photo could not be uploaded. Try again.");
        return;
      }

      addPhoto(result.url);
      setFileName("");
      if (fileInput.current) fileInput.current.value = "";
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="block">
      <span className={labelClass}>Photos</span>
      <p className="mt-1 text-xs text-river-500">
        The cover photo is used on the tour cards, the banner and the social share image. Add more
        for the gallery arrows. JPG, PNG, WebP, AVIF or GIF under 4 MB.
      </p>

      {photos.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((url, position) => {
            const isCover = url === cover;

            return (
              <li
                key={url}
                className={`overflow-hidden rounded-xl border bg-white ${
                  isCover ? "border-river-500 ring-2 ring-river-200" : "border-river-100"
                }`}
              >
                {/* Operator-supplied URL: a plain img keeps the preview out of next/image remote config. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-24 w-full object-cover" />
                <div className="space-y-1 p-2">
                  <p className="text-[11px] font-semibold text-river-500">
                    {isCover ? "Cover · used on cards" : `Photo ${position + 1}`}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {isCover ? null : (
                      <button
                        type="button"
                        onClick={() => setCover(url)}
                        className="rounded-md bg-river-50 px-2 py-1 text-[11px] font-semibold text-river-700 hover:bg-river-100"
                      >
                        Set as cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(url)}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-river-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-3 grid h-24 place-items-center rounded-xl border border-dashed border-river-200 bg-river-50 text-xs text-river-400">
          No photos yet
        </div>
      )}

      <div className="mt-3 rounded-lg border border-river-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            onChange={(event) => {
              setFileName(event.target.files?.[0]?.name ?? "");
              setError(null);
            }}
            className="max-w-[15rem] text-xs text-river-700 file:mr-2 file:rounded-md file:border-0 file:bg-river-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-river-800 hover:file:bg-river-200"
          />
          <button
            type="button"
            onClick={upload}
            disabled={busy || !fileName || Boolean(uploadHint)}
            className={buttonSecondary}
          >
            {busy ? "Uploading…" : "Add photo"}
          </button>
        </div>

        {uploadHint ? (
          <p className="mt-2 text-xs text-amber-800">{uploadHint} Pasting an image link still works.</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="text-xs text-river-500">…or paste an image URL</span>
            <input
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="https://… or /media/tours/telaga-waja-rafting.jpg"
              className={inputClass}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              addPhoto(urlInput);
              setUrlInput("");
              setError(null);
            }}
            disabled={!urlInput.trim()}
            className={buttonSecondary}
          >
            Add link
          </button>
        </div>
      </div>

      {error ? <span className="mt-1 block text-xs text-red-700">{error}</span> : null}

      <input type="hidden" name="image_url" value={cover} readOnly />
      <input
        type="hidden"
        name="gallery_urls"
        value={JSON.stringify(photos.filter((photo) => photo !== cover))}
        readOnly
      />
    </div>
  );
}
