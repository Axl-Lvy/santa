import { redirect } from "next/navigation";

import { ChatComposer } from "@/app/_components/chat/composer";
import { ChatThread } from "@/app/_components/chat/thread";
import { markRead } from "@/lib/activity";
import { sendAnonMessageAction } from "@/lib/actions/messages";
import { listAnonThread } from "@/lib/anon-messages";
import { gifteeOf } from "@/lib/assignment";
import { getDb } from "@/lib/db";
import { getParticipant } from "@/lib/participants";
import { requirePageParticipant } from "@/lib/viewer";

async function sendToGiftee(body: string) {
  "use server";
  return sendAnonMessageAction("giftee", body);
}

async function sendToSanta(body: string) {
  "use server";
  return sendAnonMessageAction("santa", body);
}

/** One of the two anonymous threads, seen from the viewer's side. */
export async function AnonThread({ side }: { side: "giftee" | "santa" }) {
  const { me } = await requirePageParticipant();
  const db = getDb();
  const gifteeId = gifteeOf(db, me.id);
  if (gifteeId === null) redirect("/messages");
  markRead(db, me.id, side);

  if (side === "giftee") {
    const giftee = getParticipant(db, gifteeId)!;
    return (
      <ChatThread
        title={giftee.firstName}
        subtitle="Tu écris en secret"
        avatar="🤫"
        avatarStyle={{ background: "var(--fir)", color: "var(--gold-light)" }}
        banner={{
          tone: "dark",
          icon: "🤫",
          text: `${giftee.firstName} ne sait pas que c'est toi. Tes messages arrivent signés « Ton Père Noël secret ».`,
        }}
        messages={listAnonThread(db, gifteeId).map((m) => ({
          key: m.id,
          mine: m.direction === "from_santa",
          body: m.body,
          createdAt: m.createdAt,
        }))}
        empty={`Écris le premier message à ${giftee.firstName}, en secret.`}
        composer={
          <ChatComposer placeholder={`Écrire à ${giftee.firstName}…`} onSend={sendToGiftee} />
        }
      />
    );
  }

  return (
    <ChatThread
      title="Ton Père Noël secret"
      subtitle="Tu ne sais pas qui c'est"
      avatar="🎅"
      avatarStyle={{ background: "var(--brick)", color: "#fff" }}
      banner={{
        tone: "warm",
        icon: "🎁",
        text: "Quelqu'un de la famille te prépare un cadeau. Réponds-lui librement, son identité reste cachée.",
      }}
      messages={listAnonThread(db, me.id).map((m) => ({
        key: m.id,
        mine: m.direction === "from_giftee",
        body: m.body,
        createdAt: m.createdAt,
      }))}
      empty="Ton Père Noël secret ne t'a pas encore écrit. Tu peux lui écrire le premier !"
      composer={<ChatComposer placeholder="Répondre à ton Père Noël…" onSend={sendToSanta} />}
    />
  );
}
