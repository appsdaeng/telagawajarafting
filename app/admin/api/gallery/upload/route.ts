import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { sql } from "@/lib/db";
import { StorageError, storageConfigured, uploadImage } from "@/lib/storage";

const CATEGORIES = ["rafting", "river", "team", "guests"];
const TRUTHY = new Set(["on", "true", "1"]);

/**
 * Device uploads post here as a plain HTML form, so every outcome is a redirect
 * the browser follows: success and failure both land back on /admin/gallery.
 */
function back(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/admin/gallery", request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  if (!storageConfigured) {
    return back(request, {
      error:
        "Photo upload is turned off: add SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables.",
    });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return back(request, { error: "Choose a photo from your device first." });
  }

  const alt =
    String(form.get("alt") ?? "").trim() ||
    file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() ||
    "Telaga Waja Rafting";
  const caption = String(form.get("caption") ?? "").trim();
  const categoryValue = String(form.get("category") ?? "").trim();
  const category = CATEGORIES.includes(categoryValue) ? categoryValue : "rafting";
  const parsedOrder = Number.parseInt(String(form.get("sort_order") ?? ""), 10);
  const sortOrder = Number.isFinite(parsedOrder) ? parsedOrder : 0;
  // Staff uploads wait for approval, exactly like pasted links.
  const approved = user.role === "ADMIN" && TRUTHY.has(String(form.get("approved")));

  let url: string;

  try {
    url = await uploadImage(file);
  } catch (error) {
    if (error instanceof StorageError) {
      return back(request, { error: error.message });
    }
    console.error("[admin/gallery] could not upload the photo", error);
    return back(request, { error: "The photo could not be uploaded. Try again." });
  }

  try {
    await sql`
      insert into public.gallery_images (url, alt, caption, category, sort_order, approved, uploaded_by)
      values (${url}, ${alt}, ${caption}, ${category}, ${sortOrder}, ${approved}, ${user.id})
    `;
  } catch (error) {
    console.error("[admin/gallery] could not save the uploaded photo", error);
    return back(request, {
      error: `The photo reached storage but could not be saved: ${url}`,
    });
  }

  await writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "added_gallery_image",
    entity: "gallery",
    entityId: url,
    meta: { alt, uploaded: true },
  });

  revalidatePath("/admin/gallery");

  return back(request, { saved: "1" });
}
