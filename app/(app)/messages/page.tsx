import Link from "next/link";

import styles from "@/app/_components/card.module.css";
import { TabTransition } from "@/app/_components/tab-transition";
import chat from "@/app/_components/chat/chat.module.css";
import { listAnonThread } from "@/lib/anon-messages";
import { gifteeOf } from "@/lib/assignment";
import { getDb } from "@/lib/db";
import { getParticipant } from "@/lib/participants";
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
  const gifteeId = gifteeOf(db, me.id);
  const giftee = gifteeId === null ? null : getParticipant(db, gifteeId);
  const lastFromSanta = listAnonThread(db, me.id).at(-1);
  const lastToGiftee = giftee ? listAnonThread(db, giftee.id).at(-1) : undefined;

  return (
    <TabTransition>
      <main className={styles.page}>
        <h1 className={styles.title}>Messages</h1>
        {giftee ? (
          <>
            <Conversation
              href="/messages/pere-noel"
              role="Ton Père Noël secret"
              name="Quelqu'un qui te gâte"
              preview={
                lastFromSanta
                  ? `${lastFromSanta.direction === "from_giftee" ? "Toi : " : ""}${lastFromSanta.body}`
                  : "Écris-lui quand tu veux"
              }
              avatar="🎅"
              avatarStyle={{ background: "var(--brick)", color: "#fff" }}
              unread={unread.santa}
            />
            <Conversation
              href="/messages/mission"
              role="Ta mission"
              name={giftee.firstName}
              preview={
                lastToGiftee
                  ? `${lastToGiftee.direction === "from_santa" ? "Toi : " : ""}${lastToGiftee.body}`
                  : "Tu écris en secret"
              }
              avatar="🤫"
              avatarStyle={{ background: "var(--fir)", color: "var(--gold-light)" }}
              unread={unread.giftee}
            />
          </>
        ) : null}
        <Conversation
          href="/messages/famille"
          role="Tout le monde"
          name="Discussion de famille"
          preview={
            last
              ? `${last.authorId === me.id ? "Toi" : last.authorName} : ${last.body}`
              : "Personne n'a encore écrit"
          }
          avatar="👨‍👩‍👧"
          avatarStyle={{ background: "var(--gold)", color: "var(--fir)" }}
          unread={unread.group}
        />
      </main>
    </TabTransition>
  );
}
