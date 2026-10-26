import { ChatComposer } from "@/app/_components/chat/composer";
import { ChatThread } from "@/app/_components/chat/thread";
import { markRead } from "@/lib/activity";
import { sendGroupMessageAction } from "@/lib/actions/messages";
import { getDb } from "@/lib/db";
import { listGroupMessages } from "@/lib/group-messages";
import { requirePageParticipant } from "@/lib/viewer";

export default async function Famille() {
  const { me } = await requirePageParticipant();
  const db = getDb();
  const messages = listGroupMessages(db);
  markRead(db, me.id, "group");

  return (
    <ChatThread
      title="Discussion de famille"
      subtitle="Tout le monde peut lire"
      avatar="👨‍👩‍👧"
      avatarStyle={{ background: "var(--gold)", color: "var(--fir)" }}
      messages={messages.map((m) => ({
        key: String(m.id),
        mine: m.authorId === me.id,
        author: m.authorName,
        body: m.body,
        createdAt: m.createdAt,
      }))}
      empty="Personne n'a encore écrit. Lance la conversation !"
      composer={
        <ChatComposer
          storageKey="famille"
          placeholder="Écrire à la famille…"
          onSend={sendGroupMessageAction}
        />
      }
    />
  );
}
