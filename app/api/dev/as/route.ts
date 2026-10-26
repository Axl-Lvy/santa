import { NextResponse, type NextRequest } from "next/server";

import { DEV_AS_COOKIE, getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Test tool: act as another email, then go back to `next` (a path on this site). */
export async function GET(request: NextRequest): Promise<Response> {
  const viewer = await getViewer();
  if (!viewer?.canImpersonate) return new Response("Not found", { status: 404 });
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const response = NextResponse.redirect(new URL(safeNext, request.url));
  response.cookies.set(DEV_AS_COOKIE, email, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}
