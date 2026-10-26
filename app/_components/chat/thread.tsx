import Link from "next/link";
import type { ReactNode } from "react";

import { Bubble } from "./bubble";
import styles from "./chat.module.css";
import { ScrollToBottom } from "./scroll-to-bottom";

export type ThreadMessage = { key: string; mine: boolean; author?: string; body: string; createdAt: string };

const dayFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" });
const dayKey = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" });

function dayLabel(iso: string, today: Date): string {
  const key = dayKey.format(new Date(iso));
  if (key === dayKey.format(today)) return "Aujourd'hui";
  if (key === dayKey.format(new Date(today.getTime() - 86_400_000))) return "Hier";
  return dayFormat.format(new Date(iso));
}

/** A conversation screen: header, optional banner, messages, then the composer slot. */
export function ChatThread({
  title,
  subtitle,
  avatar,
  avatarStyle,
  banner,
  messages,
  empty,
  composer,
}: {
  title: string;
  subtitle: string;
  avatar: string;
  avatarStyle: React.CSSProperties;
  banner?: { tone: "dark" | "warm"; icon: string; text: string };
  messages: ThreadMessage[];
  empty: string;
  composer: ReactNode;
}) {
  const today = new Date();
  const days = messages.map((m) => dayLabel(m.createdAt, today));
  return (
    <main className={styles.thread}>
      <header className={styles.top}>
        <Link href="/messages" className={styles.back} aria-label="Retour aux messages">
          ‹
        </Link>
        <div className={styles.avatar} style={avatarStyle} aria-hidden>
          {avatar}
        </div>
        <div className={styles.who}>
          {title}
          <small>{subtitle}</small>
        </div>
      </header>
      {banner ? (
        <div className={`${styles.banner} ${banner.tone === "dark" ? styles.bannerDark : styles.bannerWarm}`}>
          <span aria-hidden>{banner.icon}</span>
          <span>{banner.text}</span>
        </div>
      ) : null}
      <div className={styles.messages}>
        {messages.length === 0 ? <p className={styles.empty}>{empty}</p> : null}
        {messages.map((m, i) => {
          const day = days[i];
          const showDay = i === 0 || day !== days[i - 1];
          const showAuthor = !m.mine && m.author && (showDay || messages[i - 1]?.author !== m.author || messages[i - 1]?.mine);
          return (
            <div key={m.key} style={{ display: "contents" }}>
              {showDay ? <div className={styles.day}>{day}</div> : null}
              {showAuthor ? <div className={styles.author}>{m.author}</div> : null}
              <Bubble mine={m.mine}>{m.body}</Bubble>
            </div>
          );
        })}
        <ScrollToBottom count={messages.length} />
      </div>
      {composer}
    </main>
  );
}
