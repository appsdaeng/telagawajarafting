import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getTourById } from "@/lib/bookings";
import {
  PageHeader,
  buttonDanger,
  buttonSecondary,
} from "@/app/admin/_components/ui";
import { deleteTourAction, duplicateTourAction, toggleTourAction } from "../../actions";
import { storageSetupHint } from "@/lib/storage";
import { TourEditor } from "../tour-editor";

export const metadata: Metadata = { title: "Edit tour" };

export default async function EditTourPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; duplicated?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { saved, duplicated, error } = await searchParams;
  const tour = await getTourById(id);

  if (!tour) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={tour.name}
        description={`/${tour.slug} · ${tour.published ? "published" : "hidden"}`}
        actions={
          <>
            <Link href="/admin/tours" className={buttonSecondary}>
              Back
            </Link>
            <Link href={`/tours/${tour.slug}`} className={buttonSecondary}>
              View page
            </Link>
          </>
        }
      />

      {saved || duplicated ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {duplicated ? "Copied. The new tour is hidden until you publish it." : "Tour saved."}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <TourEditor tour={tour} uploadHint={storageSetupHint()} />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-river-100 bg-white p-4">
        <form action={toggleTourAction}>
          <input type="hidden" name="id" value={tour.id} />
          <button type="submit" className={buttonSecondary}>
            {tour.published ? "Hide from the site" : "Publish"}
          </button>
        </form>

        <form action={duplicateTourAction}>
          <input type="hidden" name="id" value={tour.id} />
          <button type="submit" className={buttonSecondary}>
            Duplicate
          </button>
        </form>

        <details className="ml-auto">
          <summary className="cursor-pointer text-xs font-medium text-red-700">
            Delete this tour
          </summary>
          <form action={deleteTourAction} className="mt-2 flex items-center gap-2">
            <input type="hidden" name="id" value={tour.id} />
            <span className="text-xs text-river-600">
              Only possible when the tour has no bookings.
            </span>
            <button type="submit" className={buttonDanger}>
              Confirm delete
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}

export const instant = false;
