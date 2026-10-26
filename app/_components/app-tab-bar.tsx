import { getDb } from "@/lib/db";
import type { Participant } from "@/lib/participants";
import { unreadCounts } from "@/lib/unread";

import { TabBar } from "./tab-bar";

/** The tab bar with fresh unread badges; rendered by each page so it updates on every navigation. */
export function AppTabBar({ me }: { me: Participant }) {
  const unread = unreadCounts(getDb(), me);
  return (
    <TabBar badges={{ "/messages": unread.group + unread.santa + unread.giftee || undefined }} />
  );
}
