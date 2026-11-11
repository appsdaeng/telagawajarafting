import type { TourRow } from "@/lib/db-types";
import {
  buttonPrimary,
  inputClass,
  labelClass,
} from "@/app/admin/_components/ui";
import { RichTextField } from "@/app/admin/_components/rich-text";
import { TourGalleryField } from "@/app/admin/_components/tour-gallery-field";
import { storageSetupHint } from "@/lib/storage";
import { saveTourWithRichTextAction } from "./save-tour";

function Area({
  name,
  label,
  hint,
  defaultValue,
  rows = 4,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string[];
  rows?: number;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={(defaultValue ?? []).join("\n")}
        className={inputClass}
      />
      <span className="mt-1 block text-xs text-river-500">{hint}</span>
    </label>
  );
}

export function TourForm({ tour }: { tour?: TourRow }) {
  return (
    <form action={saveTourWithRichTextAction} className="space-y-5">
      {tour ? <input type="hidden" name="id" value={tour.id} /> : null}

      <div className="grid gap-4 rounded-2xl border border-river-100 bg-white p-4 shadow-sm sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Name</span>
          <input name="name" required defaultValue={tour?.name} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>URL slug</span>
          <input
            name="slug"
            defaultValue={tour?.slug}
            placeholder="telaga-waja-rafting"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-river-500">
            Lowercase words with hyphens. Leave empty to generate from the name.
          </span>
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>Tagline</span>
          <input name="tagline" defaultValue={tour?.tagline} className={inputClass} />
        </label>

        <div className="sm:col-span-2">
          <RichTextField
            name="description"
            label="Short description"
            placeholder="One or two sentences for the tour cards and search results…"
            defaultValue={tour?.description}
          />
        </div>

        <Area
          name="story"
          label="Full description (one paragraph per line)"
          hint="Used on the tour detail page. Aim for three or four original paragraphs."
          defaultValue={tour?.story}
          rows={6}
        />

        <div className="grid gap-4">
          <label className="block">
            <span className={labelClass}>Adult price (IDR)</span>
            <input
              name="price_adult"
              type="number"
              min="0"
              step="1000"
              defaultValue={tour?.price_adult ?? 0}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Child price (IDR)</span>
            <input
              name="price_child"
              type="number"
              min="0"
              step="1000"
              defaultValue={tour?.price_child ?? 0}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Duration</span>
            <input name="duration" defaultValue={tour?.duration} className={inputClass} />
          </label>
        </div>

        <RichTextField
          name="includes"
          label="What's included (one per line)"
          placeholder="Hotel pickup and drop-off…"
          defaultValue={tour?.includes}
          multiple
          addLabel="Add item"
        />
        <RichTextField
          name="highlights"
          label="Highlights (one per line)"
          placeholder="Two hours on the river…"
          defaultValue={tour?.highlights}
          multiple
          addLabel="Add item"
        />
        <Area
          name="itinerary"
          label="Itinerary (one per line)"
          hint="Shown on the tour page under Highlights. Start each line with the time, e.g. 09:00 Hotel pickup from Ubud."
          defaultValue={tour?.itinerary}
          rows={6}
        />
        <Area
          name="good_to_know"
          label="Good to know (one per line)"
          defaultValue={tour?.good_to_know}
        />

        <label className="block">
          <span className={labelClass}>Meeting point</span>
          <input name="meeting_point" defaultValue={tour?.meeting_point} className={inputClass} />
        </label>
      </div>

      <div className="grid gap-4 rounded-2xl border border-river-100 bg-white p-4 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TourGalleryField
            coverDefault={tour?.image_url}
            galleryDefault={tour?.gallery_urls}
            uploadHint={storageSetupHint()}
          />
        </div>
        <label className="block">
          <span className={labelClass}>Photo alt text</span>
          <input name="image_alt" defaultValue={tour?.image_alt} className={inputClass} />
          <span className="mt-1 block text-xs text-river-500">
            Required for SEO and screen readers — describe the photo, do not repeat the name.
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>SEO title</span>
          <input
            name="seo_title"
            maxLength={60}
            defaultValue={tour?.seo_title}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-river-500">Under 60 characters.</span>
        </label>
        <label className="block">
          <span className={labelClass}>Meta description</span>
          <textarea
            name="seo_description"
            rows={2}
            maxLength={160}
            defaultValue={tour?.seo_description}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-river-500">Under 160 characters.</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-river-100 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={tour?.published ?? true} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="popular" defaultChecked={tour?.popular ?? false} />
          Most popular badge
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs text-river-700">Order</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={tour?.sort_order ?? 0}
            className={inputClass}
          />
        </label>

        <button type="submit" className={`ml-auto ${buttonPrimary}`}>
          {tour ? "Save tour" : "Create tour"}
        </button>
      </div>
    </form>
  );
}
