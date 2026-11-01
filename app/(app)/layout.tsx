import { redirect } from "next/navigation";

import { LiveRefresh } from "@/app/_components/live-refresh";
import { LoginScreen } from "@/app/_components/login-screen";
import { NotAGuest } from "@/app/_components/not-a-guest";
import { getDb } from "@/lib/db";
import { isDrawn } from "@/lib/event";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// Layouts do not re-render on client navigation, so pages repeat the reveal gate (requirePageParticipant)
// and render their own tab bar. The gate here turns a direct load into a plain HTTP redirect.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  if (!viewer) return <LoginScreen />;
  if (!viewer.participant) return <NotAGuest />;
  if (viewer.participant.revealedAt === null && isDrawn(getDb())) redirect("/decouvrir");
  return (
    <>
      {children}
      <LiveRefresh />
    </>
  );
}
