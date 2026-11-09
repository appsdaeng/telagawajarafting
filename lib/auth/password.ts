import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Password hashing with scrypt from Node's standard library.
 *
 * scrypt with N=16384, r=8, p=1 costs ~16 MB of memory per hash, which is in the
 * same class as bcrypt cost 12 and needs no native module on Vercel. The stored
 * format keeps the parameters, so raising the cost later still verifies old
 * passwords: `scrypt$N$r$p$salt$key` in base64url.
 */
const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, PARAMS);

  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");

  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const [, n, r, p, saltPart, keyPart] = parts;
  const salt = Buffer.from(saltPart, "base64url");
  const expected = Buffer.from(keyPart, "base64url");

  if (salt.length === 0 || expected.length === 0) {
    return false;
  }

  try {
    const actual = await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Minimum length enforced on both setup and staff password resets. */
export const MIN_PASSWORD_LENGTH = 12;
