import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "@/lib/db-types";

/**
 * Session cookie.
 *
 * A compact HMAC-signed payload rather than a server-side session table: the
 * cookie is HttpOnly, SameSite=Lax, Secure in production, expires after 8 hours,
 * and its role claim is only ever used for UI hints — every page and action
 * re-reads the user row and checks the role on the server.
 */
export const SESSION_COOKIE = "twr_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8;

export type SessionPayload = { uid: string; role: Role; exp: number };

export const authConfigured = (process.env.AUTH_SECRET ?? "").trim().length >= 32;

function secret(): string {
  return (process.env.AUTH_SECRET ?? "").trim();
}

function signature(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function createToken(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signature(body)}`;
}

export function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token || secret().length < 32) {
    return null;
  }

  const [body, provided] = token.split(".");

  if (!body || !provided) {
    return null;
  }

  const expected = Buffer.from(signature(body), "base64url");
  let actual: Buffer;

  try {
    actual = Buffer.from(provided, "base64url");
  } catch {
    return null;
  }

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;

    if (!payload?.uid || typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function sessionPayload(userId: string, role: Role): SessionPayload {
  return {
    uid: userId,
    role,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

export async function startSession(userId: string, role: Role): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createToken(sessionPayload(userId, role)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
