import { cache } from "react";
import { redirect } from "next/navigation";
import { databaseConfigured, sql } from "@/lib/db";
import type { Role, UserRow } from "@/lib/db-types";
import { readSession } from "./session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
};

/**
 * The signed-in user, re-read from the database on every request.
 *
 * `cache()` de-duplicates the lookup within one render, which is why a page and
 * its layout can both call a guard without a second query.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Read the cookie first, unconditionally: it makes every portal route dynamic
  // even when the build has no DATABASE_URL, so Vercel never freezes a
  // "redirect to login" page at build time.
  const session = await readSession();

  if (!session || !databaseConfigured) {
    return null;
  }

  try {
    const rows = await sql<SessionUser[]>`
      select id, email, name, role, active
      from public.users
      where id = ${session.uid}
      limit 1
    `;
    const user = rows[0];

    return user && user.active ? user : null;
  } catch {
    return null;
  }
});

/** Any signed-in, active user (ADMIN or STAFF). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

/** Full-access pages and mutations. Staff never reach these. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/admin?denied=1");
  }

  return user;
}

/** POS and gallery, which staff and admin both need. */
export const requireStaff = requireUser;

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await sql<UserRow[]>`
    select id, email, name, password_hash, role, active, last_login_at, created_at
    from public.users
    where lower(email) = ${email.trim().toLowerCase()}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function countUsers(): Promise<number> {
  if (!databaseConfigured) {
    return 0;
  }

  try {
    const rows = await sql<{ count: number }[]>`
      select count(*)::int as count from public.users
    `;

    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

/* -------------------------------------------------------------------------- */
/* Login rate limiting                                                         */
/* -------------------------------------------------------------------------- */

const WINDOW = "15 minutes";
const MAX_FAILURES = 5;

/**
 * Five failed attempts per 15 minutes, per email and per IP.
 *
 * Backed by the `login_attempts` table rather than an in-memory counter, because
 * serverless instances do not share memory.
 */
export async function loginBlocked(email: string, ip: string): Promise<boolean> {
  if (!databaseConfigured) {
    return false;
  }

  try {
    const rows = await sql<{ failures: number }[]>`
      select count(*)::int as failures
      from public.login_attempts
      where ok = false
        and created_at > now() - ${WINDOW}::interval
        and (lower(email) = ${email.trim().toLowerCase()} or (ip <> '' and ip = ${ip}))
    `;

    return (rows[0]?.failures ?? 0) >= MAX_FAILURES;
  } catch {
    // Never lock the owner out because the audit table is unreachable.
    return false;
  }
}

export async function recordLogin(email: string, ip: string, ok: boolean): Promise<void> {
  try {
    await sql`
      insert into public.login_attempts (email, ip, ok)
      values (${email.trim().toLowerCase()}, ${ip}, ${ok})
    `;
  } catch {
    /* best effort */
  }
}

/** Trim stale rows so the table does not grow forever. */
export async function pruneLoginAttempts(): Promise<void> {
  try {
    await sql`delete from public.login_attempts where created_at < now() - interval '7 days'`;
  } catch {
    /* best effort */
  }
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    ""
  );
}
