import Link from "next/link";

import styles from "./card.module.css";

/** For the admin before they have added themself as a guest. */
export function NotAGuest() {
  return (
    <main
      className={styles.page}
      style={{ minHeight: "100dvh", justifyContent: "center", textAlign: "center" }}
    >
      <div style={{ fontSize: 48 }} aria-hidden>
        🎄
      </div>
      <h1 className={styles.title}>Tu n&apos;es pas encore dans la liste.</h1>
      <Link href="/organisation" className={styles.button}>
        Ouvrir l&apos;organisation
      </Link>
    </main>
  );
}
