import styles from "@/app/_components/card.module.css";

export default function Loading() {
  return (
    <main className={styles.page} aria-busy="true" aria-label="Chargement">
      <div className={styles.skeleton} style={{ height: 56, width: "60%" }} />
      <div className={styles.skeleton} style={{ height: 150 }} />
      <div className={styles.skeleton} style={{ height: 64 }} />
      <div className={styles.skeleton} style={{ height: 64 }} />
    </main>
  );
}
