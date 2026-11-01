import { getDb } from "@/lib/db";
import { listParticipants } from "@/lib/participants";
import { getViewer } from "@/lib/viewer";

import { DevSwitcherPanel } from "./dev-switcher-panel";

/** Test tool: a floating panel for the admin to act as any guest. */
export async function DevSwitcher() {
  const viewer = await getViewer();
  if (!viewer?.canImpersonate) return null;
  const people = listParticipants(getDb()).map(({ id, firstName, revealedAt }) => ({
    id,
    firstName,
    revealed: revealedAt !== null,
  }));
  return <DevSwitcherPanel currentId={viewer.participant?.id ?? null} people={people} />;
}
