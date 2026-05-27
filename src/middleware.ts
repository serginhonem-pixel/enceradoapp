import { NextRequest, NextResponse } from "next/server";
import { getTenantSlug } from "@/lib/tenant";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") ?? "";
  const slug = getTenantSlug(hostname);

  // Injeta o tenantSlug como header para uso nos Server Components
  const res = NextResponse.next();
  res.headers.set("x-tenant-slug", slug ?? "");

  // Se tiver slug mas for a raiz, redireciona para /dashboard
  if (slug && url.pathname === "/") {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)",
  ],
};
