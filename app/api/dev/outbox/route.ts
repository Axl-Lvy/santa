import { getConfig } from "@/lib/config";
import { devOutbox } from "@/lib/mail/transport";

export const dynamic = "force-dynamic";

/** Development only: the mails that would have been sent. */
export function GET(): Response {
  const config = getConfig();
  if (config.production || config.smtp) return new Response("Not found", { status: 404 });
  return Response.json(devOutbox());
}
