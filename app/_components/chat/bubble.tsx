import styles from "./chat.module.css";

export function Bubble({ mine, children, sending }: { mine: boolean; children: string; sending?: boolean }) {
  return <div className={`${styles.bubble} ${mine ? styles.out : styles.in} ${sending ? styles.sending : ""}`}>{children}</div>;
}
