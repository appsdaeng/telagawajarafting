import type { Metadata } from "next";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { GalleryRow } from "@/lib/db-types";
import {
  Badge,
  Card,
  Empty,
  PageHeader,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  labelClass,
} from "@/app/admin/_components/ui";
import { addGalleryAction, approveGalleryAction, deleteGalleryAction } from "../actions";

export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { saved, error } = await searchParams;
  const images = await sql<GalleryRow[]>`
    select * from public.gallery_images order by category, sort_order, created_at desc
  `;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gallery"
        description={
          user.role === "ADMIN"
            ? "Add photos, write alt text for SEO, approve staff uploads and delete what is not used."
            : "Upload photos. An admin approves them before they appear on the site."
        }
      />

      {saved ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Saved.</p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <Card className="p-4">
        <h2 className="text-sm font-semibold">Add a photo</h2>
        <form action={addGalleryAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Image URL</span>
            <input
              name="url"
              required
              placeholder="https://… or /media/gallery/river.jpg"
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-river-500">
              Direct image URL. Upload to Supabase Storage or Vercel Blob first; the site never
              writes to its own filesystem.
            </span>
          </label>
          <label className="block">
            <span className={labelClass}>Alt text (required)</span>
            <input name="alt" required className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Caption</span>
            <input name="caption" className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Category</span>
            <select name="category" className={inputClass} defaultValue="rafting">
              <option value="rafting">Rafting</option>
              <option value="river">River</option>
              <option value="team">Team</option>
              <option value="guests">Guests</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Sort order</span>
            <input name="sort_order" type="number" defaultValue={0} className={inputClass} />
          </label>
          {user.role === "ADMIN" ? (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="approved" defaultChecked />
              Publish immediately
            </label>
          ) : (
            <p className="text-xs text-river-500 sm:col-span-2">
              Staff uploads wait for admin approval.
            </p>
          )}
          <div className="sm:col-span-2">
            <button type="submit" className={buttonPrimary}>
              Add image
            </button>
          </div>
        </form>
      </Card>

      {images.length === 0 ? (
        <Empty>No photos yet.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative h-40 w-full bg-river-50">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-2 p-3">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge>{image.category}</Badge>
                  {image.approved ? (
                    <Badge tone="green">Live</Badge>
                  ) : (
                    <Badge tone="amber">Awaiting approval</Badge>
                  )}
                </div>
                <p className="text-xs text-river-600">{image.alt}</p>
                {image.caption ? (
                  <p className="text-xs text-river-500">{image.caption}</p>
                ) : null}
                {user.role === "ADMIN" ? (
                  <div className="flex items-center gap-3 pt-1">
                    {!image.approved ? (
                      <form action={approveGalleryAction}>
                        <input type="hidden" name="id" value={image.id} />
                        <button type="submit" className={buttonSecondary}>
                          Approve
                        </button>
                      </form>
                    ) : null}
                    <form action={deleteGalleryAction}>
                      <input type="hidden" name="id" value={image.id} />
                      <button type="submit" className="text-xs text-red-700 underline">
                        Delete
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export const instant = false;
