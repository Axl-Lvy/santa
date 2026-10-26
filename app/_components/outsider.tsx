import styles from "./card.module.css";

export function Outsider({ email }: { email: string }) {
  return (
    <main
      className={styles.page}
      style={{ minHeight: "100dvh", justifyContent: "center", textAlign: "center" }}
    >
      <div style={{ fontSize: 48 }} aria-hidden>
        🎄
      </div>
      <h1 className={styles.title}>Tu ne fais pas partie de ce tirage.</h1>
      <p>Si c&apos;est une erreur, préviens Axel.</p>
      {email ? <p className={styles.sub}>Connecté avec {email}</p> : null}
    </main>
  );
}
