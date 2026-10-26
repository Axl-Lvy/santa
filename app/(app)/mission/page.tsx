import { redirect } from "next/navigation";

import styles from "@/app/_components/card.module.css";
import { WishCard } from "@/app/_components/wish-card";
import ideaStyles from "@/app/(app)/idees/idees.module.css";
import { markRead } from "@/lib/activity";
import { gifteeOf } from "@/lib/assignment";
import { getDb } from "@/lib/db";
import { listIdeasForTarget } from "@/lib/ideas";
import { getParticipant } from "@/lib/participants";
import { requireParticipant } from "@/lib/viewer";
import { listWishes } from "@/lib/wishes";

export default async function Mission() {
  const { me } = await requireParticipant();
  const db = getDb();
  const gifteeId = gifteeOf(db, me.id);
  if (gifteeId === null) redirect("/");
  const giftee = getParticipant(db, gifteeId)!;
  const wishes = listWishes(db, giftee.id);
  const ideas = listIdeasForTarget(db, giftee.id);
  markRead(db, me.id, "ideas");

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Les envies de {giftee.firstName}</h1>
      <p className={styles.sub}>C&apos;est toi qui lui fais un cadeau 🤫</p>
      {wishes.map((w) => (
        <WishCard key={w.id} wish={w} />
      ))}
      {wishes.length === 0 ? <p className={styles.sub}>{giftee.firstName} n&apos;a pas encore écrit d&apos;envie.</p> : null}

      <h2 className={styles.section}>💡 Idées de la famille · secret</h2>
      {ideas.map((idea) => (
        <div key={idea.id} className={ideaStyles.idea} style={{ cursor: "default" }}>
          <b>{idea.body}</b>
          <span>Une idée anonyme</span>
        </div>
      ))}
      {ideas.length === 0 ? <p className={styles.sub}>Personne n&apos;a encore soufflé d&apos;idée.</p> : null}
    </main>
  );
}
