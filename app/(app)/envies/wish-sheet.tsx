"use client";

import { useOptimistic, useState, startTransition } from "react";

import styles from "@/app/_components/card.module.css";
import { Sheet } from "@/app/_components/sheet";
import sheetStyles from "@/app/_components/sheet.module.css";
import { useAction } from "@/app/_components/use-action";
import { WishCard } from "@/app/_components/wish-card";
import { deleteWishAction, saveWishAction } from "@/lib/actions/wishes";
import type { Wish } from "@/lib/wishes";

type Draft = { id: number | null; title: string; detail: string; url: string };

const empty: Draft = { id: null, title: "", detail: "", url: "" };

export function MyWishes({ wishes }: { wishes: Wish[] }) {
  const [optimistic, addOptimistic] = useOptimistic(wishes, (current: Wish[], added: Wish) => [...current, added]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const { pending, error, setError, run } = useAction();

  const open = (d: Draft) => {
    setDraft(d);
    setError(null);
  };

  const save = () => {
    if (!draft) return;
    const input = { title: draft.title, detail: draft.detail, url: draft.url };
    if (draft.id === null && input.title.trim()) {
      startTransition(() =>
        addOptimistic({ id: -Date.now(), ownerId: 0, title: input.title.trim(), detail: input.detail.trim() || null, url: null, position: 1e9 }),
      );
    }
    run(() => saveWishAction(draft.id, input), () => setDraft(null));
  };

  return (
    <>
      {optimistic.map((w) => (
        <WishCard
          key={w.id}
          wish={w}
          pending={w.id < 0}
          onClick={w.id < 0 ? undefined : () => open({ id: w.id, title: w.title, detail: w.detail ?? "", url: w.url ?? "" })}
        />
      ))}
      {optimistic.length === 0 ? <p className={styles.sub}>Ta liste est vide pour l&apos;instant.</p> : null}
      <button type="button" className={styles.button} onClick={() => open(empty)}>
        ＋ Ajouter une envie
      </button>

      <Sheet open={draft !== null} onClose={() => setDraft(null)} title={draft?.id ? "Modifier mon envie" : "Nouvelle envie"}>
        {draft ? (
          <>
            <label className={sheetStyles.label} htmlFor="w-title">
              Qu&apos;est-ce qui te ferait plaisir ?
            </label>
            <input
              id="w-title"
              className={sheetStyles.field}
              value={draft.title}
              maxLength={200}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <label className={sheetStyles.label} htmlFor="w-detail">
              Un détail ? <small>(facultatif)</small>
            </label>
            <input
              id="w-detail"
              className={sheetStyles.field}
              placeholder="Taille, couleur, marque…"
              value={draft.detail}
              maxLength={500}
              onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
            />
            <label className={sheetStyles.label} htmlFor="w-url">
              Un lien ? <small>(facultatif)</small>
            </label>
            <input
              id="w-url"
              className={sheetStyles.field}
              type="url"
              inputMode="url"
              autoCapitalize="none"
              placeholder="Colle un lien ici"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
            {error ? <p className={styles.error}>{error}</p> : null}
            <button type="button" className={`${styles.button} ${styles.buttonBrick}`} disabled={pending} onClick={save}>
              {draft.id ? "Enregistrer" : "Ajouter à ma liste"}
            </button>
            {draft.id ? (
              <button
                type="button"
                className={`${styles.button} ${styles.buttonGhost}`}
                disabled={pending}
                onClick={() => draft.id && run(() => deleteWishAction(draft.id!), () => setDraft(null))}
              >
                Supprimer cette envie
              </button>
            ) : null}
          </>
        ) : null}
      </Sheet>
    </>
  );
}
