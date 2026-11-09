import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { sql } from "@/lib/db";
import {
  Badge,
  Card,
  PageHeader,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  labelClass,
} from "@/app/admin/_components/ui";
import { createStaffAction, resetStaffPasswordAction, toggleStaffAction } from "../actions";

export const metadata: Metadata = { title: "Staff" };

type StaffRow = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF";
  active: boolean;
  last_login_at: string | null;
  created_at: string;
  sales: number;
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  const { saved, error } = await searchParams;

  const staff = await sql<StaffRow[]>`
    select u.id, u.email, u.name, u.role, u.active,
           u.last_login_at::text as last_login_at, u.created_at::text as created_at,
           coalesce(count(b.id) filter (where b.source = 'POS'), 0)::int as sales
    from public.users u
    left join public.bookings b on b.created_by = u.id
    group by u.id
    order by u.role, u.name
  `;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff"
        description="Admins have full access. Staff can only use POS and gallery uploads."
      />

      {saved ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Saved.</p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <Card className="p-4">
        <h2 className="text-sm font-semibold">Add an account</h2>
        <form action={createStaffAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Name</span>
            <input name="name" required className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Temporary password</span>
            <input
              name="password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-river-500">
              At least {MIN_PASSWORD_LENGTH} characters. Ask them to change it after signing in —
              password change lives on this page for now.
            </span>
          </label>
          <label className="block">
            <span className={labelClass}>Role</span>
            <select name="role" className={inputClass} defaultValue="STAFF">
              <option value="STAFF">Staff — POS and gallery only</option>
              <option value="ADMIN">Admin — full access</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={buttonPrimary}>
              Create account
            </button>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <h2 className="border-b border-river-100 px-4 py-3 text-sm font-semibold">Accounts</h2>
        <ul className="divide-y divide-river-50">
          {staff.map((person) => (
            <li key={person.id} className="space-y-2 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {person.name}
                    <span className="ml-2 text-xs text-river-500">{person.email}</span>
                  </p>
                  <p className="text-xs text-river-500">
                    {person.role} · {person.sales} POS sale{person.sales === 1 ? "" : "s"} · last
                    login{" "}
                    {person.last_login_at ? person.last_login_at.slice(0, 16) : "never"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={person.active ? "green" : "red"}>
                    {person.active ? "Active" : "Disabled"}
                  </Badge>
                  {person.id === admin.id ? (
                    <span className="text-xs text-river-500">You</span>
                  ) : (
                    <form action={toggleStaffAction}>
                      <input type="hidden" name="id" value={person.id} />
                      <button type="submit" className={buttonSecondary}>
                        {person.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <details>
                <summary className="cursor-pointer text-xs text-river-600">
                  Reset password
                </summary>
                <form
                  action={resetStaffPasswordAction}
                  className="mt-2 flex flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="id" value={person.id} />
                  <label className="block">
                    <span className={labelClass}>New password</span>
                    <input
                      name="password"
                      type="password"
                      minLength={MIN_PASSWORD_LENGTH}
                      required
                      className={inputClass}
                    />
                  </label>
                  <button type="submit" className={buttonSecondary}>
                    Set password
                  </button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export const instant = false;
