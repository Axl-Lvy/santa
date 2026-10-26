import { redirect } from "next/navigation";

import { LiveRefresh } from "@/app/_components/live-refresh";
import { Outsider } from "@/app/_components/outsider";
import { getDb } from "@/lib/db";
import { isDrawn } from "@/lib/event";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// Layouts do not re-render on client navigation, so pages repeat the reveal gate (requirePageParticipant)
// and render their own tab bar. The gate here turns a direct load into a plain HTTP redirect.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  if (!viewer?.participant) return <Outsider email={viewer?.email ?? ""} />;
  if (viewer.participant.revealedAt === null && isDrawn(getDb())) redirect("/decouvrir");
  return (
    <>
      {children}
      <LiveRefresh />
    </>
  );
}
