import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authPages = ["/login", "/signup", "/invitation"];
const protectedPrefixes = [
  "/dashboard",
  "/users",
  "/profile",
  "/employees",
  "/departments",
  "/teams",
  "/organization",
  "/leaves",
  "/attendance",
  "/notifications",
  "/audit-logs",
  "/settings",
  "/roles",
  "/permissions",
  "/my-leave",
  "/my-attendance",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("refreshToken")?.value);

  if (authPages.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
