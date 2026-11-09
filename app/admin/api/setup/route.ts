import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/auth/session";
import { countUsers } from "@/lib/auth";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { databaseConfigured, sql } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The form posts here as a plain HTML form, so every outcome is an HTTP
 * redirect the browser can follow: success goes to the dashboard, failures go
 * back to /admin/setup?error=... where the page renders the message.
 */
function backToSetup(request: NextRequest, error: string) {
  const url = new URL("/admin/setup", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  // One-time bootstrap: only runs while no account exists.
  if (!databaseConfigured) {
    return backToSetup(request, "config");
  }

  if ((await countUsers()) > 0) {
    // Account already exists; this URL cannot create a second admin.
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!name || !EMAIL_PATTERN.test(email)) {
    return backToSetup(request, "invalid");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return backToSetup(request, "short");
  }

  if (password !== confirm) {
    return backToSetup(request, "mismatch");
  }

  const passwordHash = await hashPassword(password);

  let created: { id: string } | undefined;

  try {
    const rows = await sql<{ id: string }[]> `
      insert into public.users (email, name, password_hash, role, active)
      values (${email}, ${name}, ${passwordHash}, 'ADMIN', true)
      returning id
    `;
    created = rows[0];
  } catch (error) {
    console.error("[admin/setup] could not create the first admin", error);
    return backToSetup(request, "failed");
  }

  if (!created) {
    return backToSetup(request, "failed");
  }

  await startSession(created.id, "ADMIN");
  await writeAudit({
    actorId: created.id,
    actorEmail: email,
    action: "created_first_admin",
    entity: "user",
    entityId: created.id,
  });

  // Session cookie is attached to this response by startSession().
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
