import Link from "next/link";

import styles from "@/app/_components/card.module.css";
import chat from "@/app/_components/chat/chat.module.css";
import { getDb } from "@/lib/db";
import { listGroupMessages } from "@/lib/group-messages";
import { unreadCounts } from "@/lib/unread";
import { requireParticipant } from "@/lib/viewer";

function Conversation({
  href,
  role,
  name,
  preview,
  avatar,
  avatarStyle,
  unread,
}: {
  href: string;
  role: string;
  name: string;
  preview: string;
  avatar: string;
  avatarStyle: React.CSSProperties;
  unread: number;
}) {
  return (
    <Link href={href} className={styles.row}>
      <span className={chat.avatar} style={avatarStyle} aria-hidden>
        {avatar}
      </span>
      <span className={styles.rowText}>
        <span className={styles.kicker} style={{ fontSize: 11, margin: 0 }}>
          {role}
        </span>
        {name}
        <small>{preview}</small>
      </span>
      {unread > 0 ? <span className={styles.badge}>{unread}</span> : null}
    </Link>
  );
}

export default async function Messages() {
  const { me } = await requireParticipant();
  const db = getDb();
  const unread = unreadCounts(db, me);
  const last = listGroupMessages(db, 1)[0];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Messages</h1>
      <Conversation
        href="/messages/famille"
        role="Tout le monde"
        name="Discussion de famille"
        preview={last ? `${last.authorId === me.id ? "Toi" : last.authorName} : ${last.body}` : "Personne n'a encore écrit"}
        avatar="👨‍👩‍👧"
        avatarStyle={{ background: "var(--gold)", color: "var(--fir)" }}
        unread={unread.group}
      />
    </main>
  );
}
