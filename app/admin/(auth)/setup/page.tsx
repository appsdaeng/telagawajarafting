import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { countUsers } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { databaseConfigured } from "@/lib/db";
import { buttonPrimary, inputClass, labelClass } from "@/app/admin/_components/ui";
import { setupAction } from "../actions";

export const metadata: Metadata = { title: "Create owner account" };

const messages: Record<string, string> = {
  config: "DATABASE_URL is not set, so the account cannot be created.",
  invalid: "Enter a name and a valid email address.",
  short: `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
  mismatch: "The two passwords do not match.",
  failed: "Could not create the account. Check the database and try again.",
};

/**
 * One-time bootstrap. Disabled by the action itself the moment a user exists, so
 * leaving the URL in place cannot create a second admin.
 */
export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!databaseConfigured) {
    redirect("/admin/login?error=config");
  }

  if ((await countUsers()) > 0) {
    redirect("/admin/login");
  }

  const message = error ? (messages[error] ?? "Could not create the account.") : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-widest text-river-500 uppercase">First run</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create the owner account</h1>
          <p className="mt-1 text-sm text-river-600">
            This is the ADMIN account with full access. You can add staff from inside the portal.
          </p>
        </div>

        <form action={setupAction} className="rounded-2xl border border-river-100 bg-white p-6 shadow-sm">
          {message ? (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
          ) : null}

          <label className="block">
            <span className={labelClass}>Your name</span>
            <input name="name" required className={inputClass} placeholder="Owner" />
          </label>

          <label className="mt-4 block">
            <span className={labelClass}>Email</span>
            <input name="email" type="email" required className={inputClass} />
          </label>

          <label className="mt-4 block">
            <span className={labelClass}>Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-river-500">
              At least {MIN_PASSWORD_LENGTH} characters. Stored as an scrypt hash, never in plain
              text.
            </span>
          </label>

          <label className="mt-4 block">
            <span className={labelClass}>Confirm password</span>
            <input name="confirm" type="password" required className={inputClass} />
          </label>

          <button type="submit" className={`mt-5 w-full ${buttonPrimary}`}>
            Create account and sign in
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-river-600">
          Already have an account?{" "}
          <Link href="/admin/login" className="font-semibold text-river-700 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export const instant = false;
