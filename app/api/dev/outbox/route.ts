import { getConfig } from "@/lib/config";
import { devOutbox } from "@/lib/mail/transport";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Test tool: the mails that were captured instead of sent. */
export async function GET(): Promise<Response> {
  const viewer = await getViewer();
  if (!viewer?.canImpersonate || getConfig().smtp)
    return new Response("Not found", { status: 404 });
  return Response.json(devOutbox());
}
