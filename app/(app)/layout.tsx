import { redirect } from "next/navigation";

import { Outsider } from "@/app/_components/outsider";
import { TabBar } from "@/app/_components/tab-bar";
import { getDb } from "@/lib/db";
import { isDrawn } from "@/lib/event";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  if (!viewer?.participant) return <Outsider email={viewer?.email ?? ""} />;
  if (isDrawn(getDb()) && viewer.participant.revealedAt === null) redirect("/decouvrir");

  return (
    <>
      {children}
      <TabBar />
    </>
  );
}
