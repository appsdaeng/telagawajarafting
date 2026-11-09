import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { countUsers, getSessionUser } from "@/lib/auth";
import { authConfigured } from "@/lib/auth/session";
import { databaseConfigured } from "@/lib/db";
import { buttonPrimary, inputClass, labelClass } from "@/app/admin/_components/ui";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

const messages: Record<string, string> = {
  missing: "Enter your email and password.",
  invalid: "That email and password do not match an active account.",
  blocked: "Too many failed attempts. Wait 15 minutes and try again.",
  config: "The portal is not connected to a database yet.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getSessionUser();

  if (user) {
    redirect("/admin");
  }

  const firstRun = databaseConfigured ? (await countUsers()) === 0 : false;
  const message = error ? (messages[error] ?? "Sign-in failed. Try again.") : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-widest text-river-500 uppercase">
            Telaga Waja Rafting
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Staff portal</h1>
          <p className="mt-1 text-sm text-river-600">Sign in to manage bookings, tours and sales.</p>
        </div>

        <form action={loginAction} className="rounded-2xl border border-river-100 bg-white p-6 shadow-sm">
          {message ? (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
          ) : null}

          {!databaseConfigured ? (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables.
            </p>
          ) : null}

          {!authConfigured && databaseConfigured ? (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              AUTH_SECRET is missing or shorter than 32 characters, so sessions cannot be signed.
            </p>
          ) : null}

          <label className="block">
            <span className={labelClass}>Email</span>
            <input name="email" type="email" autoComplete="username" required className={inputClass} />
          </label>

          <label className="mt-4 block">
            <span className={labelClass}>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </label>

          <button type="submit" className={`mt-5 w-full ${buttonPrimary}`}>
            Sign in
          </button>
        </form>

        {firstRun ? (
          <p className="mt-4 text-center text-sm text-river-600">
            No account exists yet.{" "}
            <Link href="/admin/setup" className="font-semibold text-river-700 underline">
              Create the owner account
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const instant = false;
