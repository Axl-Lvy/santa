"use client";

import { useState } from "react";

import styles from "@/app/_components/card.module.css";
import { Sheet } from "@/app/_components/sheet";
import sheetStyles from "@/app/_components/sheet.module.css";
import { useAction } from "@/app/_components/use-action";
import { deleteIdeaAction, saveIdeaAction } from "@/lib/actions/ideas";

import ui from "./idees.module.css";

type Person = { id: number; firstName: string };
type MyIdea = { id: number; targetId: number; body: string };
type Draft = { id: number | null; target: Person; body: string };

export function IdeasPanel({ people, mine }: { people: Person[]; mine: MyIdea[] }) {
  const [selected, setSelected] = useState<Person | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const { pending, error, setError, run } = useAction();
  const name = (id: number) => people.find((p) => p.id === id)?.firstName ?? "?";

  const open = (d: Draft) => {
    setDraft(d);
    setError(null);
  };

  return (
    <>
      <div className={ui.people} role="group" aria-label="Pour qui as-tu une idée ?">
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            className={ui.person}
            aria-pressed={selected?.id === p.id}
            onClick={() => setSelected(p)}
          >
            <span className={ui.circle} aria-hidden>
              {p.firstName.charAt(0).toUpperCase()}
            </span>
            {p.firstName}
          </button>
        ))}
      </div>

      {selected ? (
        <>
          <p className={ui.note}>
            🤫 Seul le Père Noël secret de {selected.firstName} verra ton idée, sans savoir
            qu&apos;elle vient de toi. {selected.firstName} ne la verra jamais.
          </p>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonBrick}`}
            onClick={() => open({ id: null, target: selected, body: "" })}
          >
            Écrire mon idée pour {selected.firstName}
          </button>
        </>
      ) : null}

      {mine.length > 0 ? <h2 className={styles.section}>Mes idées soufflées</h2> : null}
      {mine.map((idea) => (
        <button
          key={idea.id}
          type="button"
          className={ui.idea}
          onClick={() =>
            open({
              id: idea.id,
              target: { id: idea.targetId, firstName: name(idea.targetId) },
              body: idea.body,
            })
          }
        >
          <b>{idea.body}</b>
          <span>Pour {name(idea.targetId)}</span>
        </button>
      ))}

      <Sheet
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={`Une idée pour ${draft?.target.firstName ?? ""}`}
      >
        {draft ? (
          <>
            <label className={sheetStyles.label} htmlFor="idea-body">
              Ton idée
            </label>
            <textarea
              id="idea-body"
              className={`${sheetStyles.field} ${ui.textarea}`}
              value={draft.body}
              placeholder="Il parle tout le temps de…"
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
            {error ? <p className={styles.error}>{error}</p> : null}
            <button
              type="button"
              className={`${styles.button} ${styles.buttonBrick}`}
              disabled={pending}
              onClick={() =>
                run(
                  () => saveIdeaAction(draft.id, draft.target.id, draft.body),
                  () => setDraft(null),
                )
              }
            >
              {draft.id ? "Enregistrer" : "Envoyer l'idée"}
            </button>
            {draft.id ? (
              <button
                type="button"
                className={`${styles.button} ${styles.buttonGhost}`}
                disabled={pending}
                onClick={() =>
                  draft.id &&
                  run(
                    () => deleteIdeaAction(draft.id!),
                    () => setDraft(null),
                  )
                }
              >
                Supprimer cette idée
              </button>
            ) : null}
          </>
        ) : null}
      </Sheet>
    </>
  );
}
