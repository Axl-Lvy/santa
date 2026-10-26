import styles from "@/app/_components/card.module.css";
import { TabTransition } from "@/app/_components/tab-transition";
import { getDb } from "@/lib/db";
import { listIdeasByAuthor } from "@/lib/ideas";
import { listParticipants } from "@/lib/participants";
import { requireParticipant } from "@/lib/viewer";

import { IdeasPanel } from "./idea-sheet";

export default async function Idees() {
  const { me } = await requireParticipant();
  const db = getDb();
  const people = listParticipants(db)
    .filter((p) => p.id !== me.id)
    .map(({ id, firstName }) => ({ id, firstName }));
  const mine = listIdeasByAuthor(db, me.id).map(({ id, targetId, body }) => ({
    id,
    targetId,
    body,
  }));

  return (
    <TabTransition>
      <main className={styles.page}>
        <h1 className={styles.title}>Souffler une idée</h1>
        <p className={styles.sub}>Pour qui as-tu une idée ?</p>
        <IdeasPanel people={people} mine={mine} />
      </main>
    </TabTransition>
  );
}
