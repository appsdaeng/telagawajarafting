import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getBusiness } from "@/lib/settings";
import {
  Card,
  PageHeader,
  buttonPrimary,
  inputClass,
  labelClass,
} from "@/app/admin/_components/ui";
import { saveBusinessSettingsAction } from "../actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const { saved, error } = await searchParams;
  const business = await getBusiness();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Contact details, opening hours and pickup areas. These feed the public site and the structured data Google reads."
      />

      {saved ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Saved.</p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <Card className="p-4">
        <form action={saveBusinessSettingsAction} className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Business name</span>
            <input name="name" required defaultValue={business.name} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>WhatsApp number</span>
            <input name="whatsapp" defaultValue={business.whatsapp} className={inputClass} />
            <span className="mt-1 block text-xs text-river-500">
              Digits only with country code, e.g. 6281234567890.
            </span>
          </label>
          <label className="block">
            <span className={labelClass}>Booking inbox</span>
            <input name="email" type="email" defaultValue={business.email} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Opening hours</span>
            <input name="hours" defaultValue={business.hours} className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Address</span>
            <input name="address" defaultValue={business.address} className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Pickup areas</span>
            <textarea
              name="pickupAreas"
              rows={2}
              defaultValue={business.pickupAreas}
              className={inputClass}
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={buttonPrimary}>
              Save settings
            </button>
          </div>
        </form>
      </Card>

      <p className="text-xs text-river-500">
        Note: the public pages still read <code>lib/tours.ts</code> for contact details. Move that
        read to <code>site_settings</code> when the tour pages are switched to database content, so
        the site and the portal cannot disagree.
      </p>
    </div>
  );
}

export const instant = false;
