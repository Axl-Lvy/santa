import { getConfig } from "@/lib/config";
import { getDb } from "@/lib/db";
import { listParticipants } from "@/lib/participants";
import { getViewer } from "@/lib/viewer";

import { DevSwitcherPanel } from "./dev-switcher-panel";

/** Test tool: a floating panel to act as any participant, for whoever may switch accounts. */
export async function DevSwitcher() {
  const config = getConfig();
  const viewer = await getViewer();
  if (!viewer?.canImpersonate) return null;
  const people = listParticipants(getDb()).map(({ firstName, email, revealedAt }) => ({
    firstName,
    email,
    revealed: revealedAt !== null,
  }));
  return <DevSwitcherPanel current={viewer.email} people={people} adminEmail={config.adminEmail} />;
}
