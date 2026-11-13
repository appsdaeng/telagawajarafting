import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getTourById } from "@/lib/bookings";
import { TourOptionForm } from "@/app/admin/_components/tour-option-form";

export const metadata: Metadata = { title: "Tour option" };

/**
 * The tour option window, opened from the Price and availability tab.
 *
 * It deliberately sits outside the admin dashboard layout group so the window
 * shows only the form, the way the editor opens it. `?index=` reopens an option
 * that is already in the table, pre-filled for editing.
 */
export default async function NewTourOptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ index?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { index } = await searchParams;
  const tour = await getTourById(id);

  if (!tour) {
    notFound();
  }

  const options = Array.isArray(tour.pricing_options) ? tour.pricing_options : [];
  const position = Number(index);
  const editing =
    index !== undefined && Number.isInteger(position) && position >= 0 && position < options.length
      ? { option: options[position], index: position }
      : { option: undefined, index: undefined };

  return (
    <div className="min-h-screen bg-river-50/60 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-river-200 bg-white shadow-sm">
        <TourOptionForm
          tourId={tour.id}
          tourName={tour.name}
          option={editing.option}
          optionIndex={editing.index}
        />
      </div>
    </div>
  );
}

export const instant = false;
