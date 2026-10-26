import { AppTabBar } from "@/app/_components/app-tab-bar";
import styles from "@/app/_components/card.module.css";
import { TabTransition } from "@/app/_components/tab-transition";
import { getDb } from "@/lib/db";
import { requirePageParticipant } from "@/lib/viewer";
import { listWishes } from "@/lib/wishes";

import { MyWishes } from "./wish-sheet";

export default async function Envies() {
  const { me } = await requirePageParticipant();

  return (
    <>
      <TabTransition>
        <main className={styles.page}>
          <h1 className={styles.title}>Ma liste d&apos;envies</h1>
          <p className={styles.sub}>🤫 Seul ton Père Noël secret la verra.</p>
          <MyWishes wishes={listWishes(getDb(), me.id)} />
        </main>
      </TabTransition>
      <AppTabBar me={me} />
    </>
  );
}
