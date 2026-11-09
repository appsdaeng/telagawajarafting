import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/auth/session";
import { countUsers } from "@/lib/auth";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { databaseConfigured, sql } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  // One-time bootstrap: only runs while no account exists.
  if (!databaseConfigured) {
    return NextResponse.json({ error: "config" }, { status: 400 });
  }

  if ((await countUsers()) > 0) {
    // Account already exists; this URL cannot create a second admin.
    return NextResponse.json({ error: "exists" }, { status: 400 });
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!name || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "short" }, { status: 400 });
  }

  if (password !== confirm) {
    return NextResponse.json({ error: "mismatch" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const rows = await sql<{ id: string }[]>`
    insert into public.users (email, name, password_hash, role, active)
    values (${email}, ${name}, ${passwordHash}, 'ADMIN', true)
    returning id
  `;

  const created = rows[0];

  if (!created) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  await startSession(created.id, "ADMIN");
  await writeAudit({
    actorId: created.id,
    actorEmail: email,
    action: "created_first_admin",
    entity: "user",
    entityId: created.id,
  });

  // Redirect to the admin dashboard on success.
  return NextResponse.json({ ok: true, redirect: "/admin" }, { status: 200 });
}
