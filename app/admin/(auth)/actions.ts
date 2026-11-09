"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import {
  clientIp,
  countUsers,
  findUserByEmail,
  loginBlocked,
  pruneLoginAttempts,
  recordLogin,
} from "@/lib/auth";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/auth/password";
import { endSession, startSession } from "@/lib/auth/session";
import { databaseConfigured, sql } from "@/lib/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!databaseConfigured) {
    redirect("/admin/login?error=config");
  }

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const ip = clientIp(await headers());

  if (await loginBlocked(email, ip)) {
    redirect("/admin/login?error=blocked");
  }

  const user = await findUserByEmail(email);
  const passwordOk = user ? await verifyPassword(password, user.password_hash) : false;
  const ok = Boolean(user && user.active && passwordOk);

  await recordLogin(email, ip, ok);

  if (!ok || !user) {
    redirect("/admin/login?error=invalid");
  }

  await sql`update public.users set last_login_at = now() where id = ${user.id}`;
  await startSession(user.id, user.role);
  await writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "signed_in",
    entity: "user",
    entityId: user.id,
  });
  await pruneLoginAttempts();

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

/** One-time bootstrap: only runs while no account exists. */
export async function setupAction(formData: FormData): Promise<void> {
  if (!databaseConfigured) {
    redirect("/admin/setup?error=config");
  }

  if ((await countUsers()) > 0) {
    redirect("/admin/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!name || !EMAIL_PATTERN.test(email)) {
    redirect("/admin/setup?error=invalid");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect("/admin/setup?error=short");
  }

  if (password !== confirm) {
    redirect("/admin/setup?error=mismatch");
  }

  const passwordHash = await hashPassword(password);

  const rows = await sql<{ id: string }[]>`
    insert into public.users (email, name, password_hash, role, active)
    values (${email}, ${name}, ${passwordHash}, 'ADMIN', true)
    returning id
  `;

  const created = rows[0];

  if (!created) {
    redirect("/admin/setup?error=failed");
  }

  await startSession(created.id, "ADMIN");
  await writeAudit({
    actorId: created.id,
    actorEmail: email,
    action: "created_first_admin",
    entity: "user",
    entityId: created.id,
  });

  redirect("/admin");
}
