import { NextResponse, type NextRequest } from "next/server";

import { getConfig } from "@/lib/config";
import { DEV_AS_COOKIE } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Development only: act as another email. */
export function GET(request: NextRequest): Response {
  const config = getConfig();
  if (config.production || !config.devIdentityEmail) return new Response("Not found", { status: 404 });
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(DEV_AS_COOKIE, email, { path: "/", httpOnly: true, sameSite: "lax" });
  return response;
}
