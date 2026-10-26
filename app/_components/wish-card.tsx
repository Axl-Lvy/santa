import type { Wish } from "@/lib/wishes";

import styles from "./wish-card.module.css";

export function WishCard({ wish, onClick, pending }: { wish: Wish; onClick?: () => void; pending?: boolean }) {
  const body = (
    <>
      <span className={styles.title}>{wish.title}</span>
      {wish.detail ? <span className={styles.detail}>{wish.detail}</span> : null}
    </>
  );
  const link = wish.url ? (
    <a className={styles.link} href={wish.url} target="_blank" rel="noopener noreferrer">
      🔗 Voir le lien
    </a>
  ) : null;
  const className = `${styles.card} ${pending ? styles.pending : ""}`;
  if (!onClick) {
    return (
      <div className={className}>
        {body}
        {link}
      </div>
    );
  }
  return (
    <div className={className}>
      <button type="button" className={styles.main} onClick={onClick}>
        {body}
      </button>
      {link}
    </div>
  );
}
