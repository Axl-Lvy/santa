import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "@/app/_components/card.module.css";
import { WishCard } from "@/app/_components/wish-card";
import { getDb } from "@/lib/db";
import { getParticipant } from "@/lib/participants";
import { requireParticipant } from "@/lib/viewer";
import { listWishes } from "@/lib/wishes";

export default async function SomeoneWishes({ params }: PageProps<"/envies/[participantId]">) {
  const { me } = await requireParticipant();
  const id = Number((await params).participantId);
  const db = getDb();
  const person = Number.isInteger(id) ? getParticipant(db, id) : null;
  if (!person || person.id === me.id) redirect("/envies");
  const wishes = listWishes(db, person.id);

  return (
    <main className={styles.page}>
      <Link href="/envies" className={styles.back}>
        ‹ Envies
      </Link>
      <h1 className={styles.title}>Les envies de {person.firstName}</h1>
      {wishes.map((w) => (
        <WishCard key={w.id} wish={w} />
      ))}
      {wishes.length === 0 ? (
        <p className={styles.sub}>{person.firstName} n&apos;a pas encore écrit d&apos;envie.</p>
      ) : null}
    </main>
  );
}
