import type { NextRequest } from "next/server";

import { DEV_AS_COOKIE, getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Test tool: act as another email, then go back to `next` (a path on this site). */
export async function GET(request: NextRequest): Promise<Response> {
  const viewer = await getViewer();
  if (!viewer?.canImpersonate) return new Response("Not found", { status: 404 });
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const https =
    request.headers.get("x-forwarded-proto") === "https" || request.nextUrl.protocol === "https:";
  const cookie = [
    `${DEV_AS_COOKIE}=${encodeURIComponent(email)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    ...(https ? ["Secure"] : []),
  ].join("; ");
  // Relative on purpose: behind the tunnel the server only knows its bind address (0.0.0.0:3000).
  return new Response(null, { status: 307, headers: { Location: safeNext, "Set-Cookie": cookie } });
}
