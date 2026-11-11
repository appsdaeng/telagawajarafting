"use client";

import { useRef, useState } from "react";
import { buttonSecondary, inputClass, labelClass } from "@/app/admin/_components/ui";

type ImageFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  hint?: string;
  /** Why device uploads cannot run yet, when storage is not configured. */
  uploadHint?: string | null;
};

/**
 * Photo field for the admin forms.
 *
 * The operator can either pick a file from their device — it is uploaded to the
 * photo store and the resulting public URL fills the field — or paste a URL
 * directly. Both paths end in the same value, posted as `name`.
 */
export function ImageField({
  name,
  label,
  defaultValue,
  hint,
  uploadHint,
}: ImageFieldProps) {
  const [url, setUrl] = useState((defaultValue ?? "").trim());
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

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

      setUrl(result.url);
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
      <span className={labelClass}>{label}</span>

      {url ? (
        <div className="mt-2 flex items-start gap-3">
          {/* Operator-supplied URL: a plain img keeps the preview free of next/image remote config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="size-20 shrink-0 rounded-lg border border-river-100 object-cover"
          />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="mt-1 rounded-md px-2 py-1 text-xs font-medium text-river-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            Remove photo
          </button>
        </div>
      ) : (
        <div className="mt-2 grid size-20 place-items-center rounded-lg border border-dashed border-river-200 bg-river-50 text-[11px] text-river-400">
          No photo
        </div>
      )}

      <div className="mt-2 rounded-lg border border-river-200 bg-white p-2 shadow-sm">
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
            {busy ? "Uploading…" : "Upload photo"}
          </button>
        </div>

        {uploadHint ? (
          <p className="mt-2 text-xs text-amber-800">{uploadHint} Pasting an image link still works.</p>
        ) : null}
      </div>

      <label className="mt-2 block">
        <span className="text-xs text-river-500">…or paste an image URL</span>
        <input
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setError(null);
          }}
          placeholder="https://… or /media/tours/telaga-waja-rafting.jpg"
          className={inputClass}
        />
      </label>

      {error ? <span className="mt-1 block text-xs text-red-700">{error}</span> : null}
      {hint ? <span className="mt-1 block text-xs text-river-500">{hint}</span> : null}

      <input type="hidden" name={name} value={url} readOnly />
    </div>
  );
}
