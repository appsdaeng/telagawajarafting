import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap edge gate for `/admin`.
 *
 * Only checks that a session cookie exists — the signature cannot be verified
 * here without Node crypto. Every page and server action re-checks the user and
 * role against the database, so this is a redirect convenience, not the
 * access-control boundary.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/setup") ||
    pathname.startsWith("/admin/api/setup") ||
    // Handles its own session check and answers with a 303, so the form POST
    // is never replayed to the login page.
    pathname.startsWith("/admin/api/gallery")
  ) {
    return NextResponse.next();
  }

  if (!request.cookies.get("twr_admin")?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
