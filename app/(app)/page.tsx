import Link from "next/link";

import styles from "@/app/_components/card.module.css";
import { getDb } from "@/lib/db";
import { getEvent } from "@/lib/event";
import { listGroupMessages } from "@/lib/group-messages";
import { requireParticipant } from "@/lib/viewer";

export default async function Home() {
  const { viewer, me } = await requireParticipant();
  const db = getDb();
  const { budgetEur } = getEvent(db);
  const last = listGroupMessages(db, 1)[0];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>
        <span className={styles.kicker}>Noël 2026</span>
        Bonjour {me.firstName}
      </h1>

      {viewer.isAdmin ? (
        <Link href="/organisation" className={styles.row}>
          <span className={styles.rowIcon} aria-hidden>
            ⚙️
          </span>
          <span className={styles.rowText}>
            Organisation
            <small>Participants, règles et tirage</small>
          </span>
        </Link>
      ) : null}

      <div className={`${styles.hero} ${styles.heroCenter}`}>
        <div className={styles.heroEmoji} aria-hidden>
          🎲
        </div>
        <div className={styles.heroTitle}>Le tirage n&apos;a pas encore eu lieu</div>
        <p className={styles.heroText}>Tu recevras un email le moment venu. En attendant…</p>
      </div>

      <Link href="/envies" className={styles.row}>
        <span className={styles.rowIcon} aria-hidden>
          🎁
        </span>
        <span className={styles.rowText}>
          Écris ta liste d&apos;envies
          <small>Pour aider ton futur Père Noël</small>
        </span>
      </Link>
      <Link href="/messages/famille" className={styles.row}>
        <span className={styles.rowIcon} aria-hidden>
          💬
        </span>
        <span className={styles.rowText}>
          Discussion de famille
          <small>
            {last ? `${last.authorId === me.id ? "Toi" : last.authorName} : « ${last.body} »` : "Tout le monde peut lire"}
          </small>
        </span>
      </Link>
      <Link href="/idees" className={styles.row}>
        <span className={styles.rowIcon} aria-hidden>
          💡
        </span>
        <span className={styles.rowText}>
          Souffle une idée
          <small>Pour quelqu&apos;un de la famille</small>
        </span>
      </Link>
      {budgetEur !== null ? (
        <div className={styles.row}>
          <span className={styles.rowIcon} aria-hidden>
            💶
          </span>
          <span className={styles.rowText}>Budget : environ {budgetEur} €</span>
        </div>
      ) : null}
    </main>
  );
}
