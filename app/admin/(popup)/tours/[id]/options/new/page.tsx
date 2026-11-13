import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getTourById } from "@/lib/bookings";
import { TourOptionForm } from "@/app/admin/_components/tour-option-form";

export const metadata: Metadata = { title: "Add option" };

/**
 * The tour option window, opened from the Price and availability tab.
 *
 * It deliberately sits outside the admin dashboard layout group so the window
 * shows only the form, the way the editor opens it.
 */
export default async function NewTourOptionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const tour = await getTourById(id);

  if (!tour) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-river-50/60 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-river-200 bg-white shadow-sm">
        <TourOptionForm tourId={tour.id} tourName={tour.name} />
      </div>
    </div>
  );
}

export const instant = false;
