import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { AdminNav, type NavItem } from "@/app/admin/_components/nav";
import { logoutAction } from "../(auth)/actions";

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/pos", label: "POS" },
  { href: "/admin/tours", label: "Tours" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/system", label: "System" },
];

const staffNav: NavItem[] = [
  { href: "/admin/pos", label: "POS" },
  { href: "/admin/gallery", label: "Gallery" },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const items = user.role === "ADMIN" ? adminNav : staffNav;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
      <aside className="bg-river-950 p-4 text-white lg:min-h-screen lg:w-60 lg:shrink-0">
        <Link href="/admin" className="block">
          <span className="text-xs font-semibold tracking-widest text-river-300 uppercase">
            Telaga Waja
          </span>
          <span className="mt-1 block text-lg font-semibold">Portal</span>
        </Link>

        <div className="mt-4 lg:mt-8">
          <AdminNav items={items} />
        </div>

        <div className="mt-6 hidden border-t border-white/10 pt-4 text-xs text-river-300 lg:block">
          <p className="font-medium text-white">{user.name}</p>
          <p className="truncate">{user.email}</p>
          <p className="mt-1 tracking-widest uppercase">{user.role}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-river-100 bg-white px-4 py-3 sm:px-6">
          <p className="text-sm text-river-600 lg:hidden">
            {user.name} · <span className="uppercase">{user.role}</span>
          </p>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-river-600 underline-offset-4 hover:underline"
            >
              View site
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-river-200 px-3 py-1.5 text-xs font-medium text-river-800 hover:bg-river-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export const instant = false;
