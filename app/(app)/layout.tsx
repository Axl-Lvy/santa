import { LiveRefresh } from "@/app/_components/live-refresh";
import { Outsider } from "@/app/_components/outsider";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// Layouts do not re-render on client navigation: the reveal gate and the tab bar live in each page.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  if (!viewer?.participant) return <Outsider email={viewer?.email ?? ""} />;
  return (
    <>
      {children}
      <LiveRefresh />
    </>
  );
}
