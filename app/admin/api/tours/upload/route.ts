import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { StorageError, storageSetupHint, uploadImage } from "@/lib/storage";

/**
 * Device uploads for the tour form.
 *
 * The form posts here with `fetch`, so answers are JSON: `{ url }` on success or
 * `{ error }` with a message the admin form can show in place.
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Your session expired. Sign in again." }, { status: 401 });
  }

  const hint = storageSetupHint();

  if (hint) {
    return NextResponse.json({ error: hint }, { status: 503 });
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "The upload could not be read. Try again." }, { status: 400 });
  }

  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a photo from your device first." }, { status: 400 });
  }

  try {
    const url = await uploadImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[admin/tours] could not upload the photo", error);
    return NextResponse.json(
      { error: "The photo could not be uploaded. Try again." },
      { status: 500 },
    );
  }
}
