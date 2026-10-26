import { redirect } from "next/navigation";

import cardStyles from "@/app/_components/card.module.css";
import { Outsider } from "@/app/_components/outsider";
import { gifteeOf } from "@/lib/assignment";
import { getDb } from "@/lib/db";
import { isDrawn } from "@/lib/event";
import { getParticipant } from "@/lib/participants";
import { getViewer } from "@/lib/viewer";

import styles from "./decouvrir.module.css";
import { revealGate } from "./scratch";
import { ScratchCard } from "./scratch-card";

export const dynamic = "force-dynamic";

export default async function Decouvrir() {
  const viewer = await getViewer();
  const me = viewer?.participant;
  if (!me) return <Outsider email={viewer?.email ?? ""} />;
  const db = getDb();
  if (revealGate(isDrawn(db), me.revealedAt) === "home") redirect("/");
  const giftee = getParticipant(db, gifteeOf(db, me.id)!);

  return (
    <main className={styles.page}>
      <span className={cardStyles.kicker}>Le tirage a eu lieu</span>
      <h1 className={cardStyles.title}>{me.firstName}, gratte pour découvrir</h1>
      <p className={styles.hint}>Frotte la carte avec ton doigt</p>
      <ScratchCard gifteeName={giftee?.firstName ?? "?"} />
    </main>
  );
}
