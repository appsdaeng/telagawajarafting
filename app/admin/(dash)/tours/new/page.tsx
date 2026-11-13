import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, buttonSecondary } from "@/app/admin/_components/ui";
import { storageSetupHint } from "@/lib/storage";
import { TourEditor } from "../tour-editor";

export const metadata: Metadata = { title: "New tour" };

export default async function NewTourPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeader
        title="New tour"
        description="Create it hidden, finish the copy and photo, then publish."
        actions={
          <Link href="/admin/tours" className={buttonSecondary}>
            Back to tours
          </Link>
        }
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <TourEditor uploadHint={storageSetupHint()} />
    </div>
  );
}

export const instant = false;
