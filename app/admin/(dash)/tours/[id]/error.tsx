"use client";

import Link from "next/link";

/**
 * A saved tour must always be reopenable. If rendering the editor throws (a
 * row shape the form did not expect, a database hiccup), Next renders this
 * instead of a blank "application error" page, so the operator sees the real
 * message and can retry or go back to the list.
 */
export default function TourEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h1 className="text-sm font-semibold text-red-900">This tour could not be opened</h1>
        <p className="mt-2 text-sm text-red-800">
          The page failed while loading the tour. Retrying usually works; if it keeps failing, the
          message below is what needs fixing.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-white/70 p-3 text-xs whitespace-pre-wrap text-red-900">
          {error.message || "Unknown error"}
          {error.digest ? `\n\ndigest ${error.digest}` : ""}
        </pre>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-river-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-river-800"
        >
          Try again
        </button>
        <Link
          href="/admin/tours"
          className="inline-flex items-center rounded-lg border border-river-200 bg-white px-4 py-2 text-sm font-semibold text-river-800 transition-colors hover:bg-river-50"
        >
          Back to tours
        </Link>
      </div>
    </div>
  );
}
