"use client";

import styles from "@/app/_components/card.module.css";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main
      className={styles.page}
      style={{ minHeight: "100dvh", justifyContent: "center", textAlign: "center" }}
    >
      <div style={{ fontSize: 48 }} aria-hidden>
        🎄
      </div>
      <h1 className={styles.title}>Oups, quelque chose s&apos;est mal passé.</h1>
      <p>Recharge la page. Si ça recommence, préviens Axel.</p>
      <button type="button" className={styles.button} onClick={() => window.location.reload()}>
        Recharger la page
      </button>
      <button type="button" className={`${styles.button} ${styles.buttonGhost}`} onClick={reset}>
        Réessayer
      </button>
    </main>
  );
}
