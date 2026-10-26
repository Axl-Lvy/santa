import Link from "next/link";

import styles from "@/app/_components/card.module.css";
import { TabTransition } from "@/app/_components/tab-transition";
import { getDb } from "@/lib/db";
import { listParticipants } from "@/lib/participants";
import { requireParticipant } from "@/lib/viewer";
import { listWishes } from "@/lib/wishes";

import { MyWishes } from "./wish-sheet";

export default async function Envies() {
  const { me } = await requireParticipant();
  const db = getDb();
  const others = listParticipants(db).filter((p) => p.id !== me.id);

  return (
    <TabTransition>
    <main className={styles.page}>
      <h1 className={styles.title}>Ma liste d&apos;envies</h1>
      <p className={styles.sub}>Toute la famille peut la voir.</p>
      <MyWishes wishes={listWishes(db, me.id)} />

      <h2 className={styles.section}>Les listes de la famille</h2>
      {others.map((p) => {
        const count = listWishes(db, p.id).length;
        return (
          <Link key={p.id} href={`/envies/${p.id}`} className={styles.row}>
            <span className={styles.rowIcon} aria-hidden style={{ fontFamily: "var(--font-title)", fontWeight: 700 }}>
              {p.firstName.charAt(0).toUpperCase()}
            </span>
            <span className={styles.rowText}>
              {p.firstName}
              <small>{count === 0 ? "Pas encore d'envie" : count === 1 ? "1 envie" : `${count} envies`}</small>
            </span>
            <span aria-hidden>›</span>
          </Link>
        );
      })}
    </main>
    </TabTransition>
  );
}
