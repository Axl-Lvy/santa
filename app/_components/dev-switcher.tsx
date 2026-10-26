import { getConfig } from "@/lib/config";
import { getDb } from "@/lib/db";
import { listParticipants } from "@/lib/participants";
import { getViewer } from "@/lib/viewer";

import { DevSwitcherPanel } from "./dev-switcher-panel";

/** Development only: a floating panel to act as any participant. Renders nothing in production. */
export async function DevSwitcher() {
  const config = getConfig();
  if (config.production || !config.devIdentityEmail) return null;
  const viewer = await getViewer();
  const people = listParticipants(getDb()).map(({ firstName, email, revealedAt }) => ({
    firstName,
    email,
    revealed: revealedAt !== null,
  }));
  return (
    <DevSwitcherPanel
      current={viewer?.email ?? ""}
      people={people}
      adminEmail={config.adminEmail}
    />
  );
}
