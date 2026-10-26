import { redirect } from "next/navigation";

import { LiveRefresh } from "@/app/_components/live-refresh";
import { Outsider } from "@/app/_components/outsider";
import { TabBar } from "@/app/_components/tab-bar";
import { getDb } from "@/lib/db";
import { isDrawn } from "@/lib/event";
import { unreadCounts } from "@/lib/unread";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  if (!viewer?.participant) return <Outsider email={viewer?.email ?? ""} />;
  const db = getDb();
  if (isDrawn(db) && viewer.participant.revealedAt === null) redirect("/decouvrir");
  const unread = unreadCounts(db, viewer.participant);

  return (
    <>
      {children}
      <TabBar badges={{ "/messages": unread.group + unread.santa + unread.giftee || undefined }} />
      <LiveRefresh />
    </>
  );
}
