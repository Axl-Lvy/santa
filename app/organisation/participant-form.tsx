"use client";

import { useState } from "react";

import styles from "@/app/_components/card.module.css";
import { Sheet } from "@/app/_components/sheet";
import sheetStyles from "@/app/_components/sheet.module.css";
import { useAction } from "@/app/_components/use-action";
import { addParticipantAction, removeParticipantAction, updateParticipantAction } from "@/lib/actions/admin";

import admin from "./organisation.module.css";

type Person = { id: number; firstName: string; email: string };

export function ParticipantForm({ people, locked }: { people: Person[]; locked: boolean }) {
  const [editing, setEditing] = useState<Person | "new" | null>(null);
  const [removing, setRemoving] = useState<Person | null>(null);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const { pending, error, setError, run } = useAction();

  const open = (p: Person | "new") => {
    setEditing(p);
    setFirstName(p === "new" ? "" : p.firstName);
    setEmail(p === "new" ? "" : p.email);
    setConfirmEdit(false);
    setError(null);
  };
  const close = () => setEditing(null);

  const save = () => {
    if (editing === null) return;
    if (editing !== "new" && locked && !confirmEdit) {
      setConfirmEdit(true);
      return;
    }
    run(
      () =>
        editing === "new"
          ? addParticipantAction(firstName, email)
          : updateParticipantAction(editing.id, firstName, email),
      close,
    );
  };

  return (
    <>
      <div className={admin.sectionHead}>
        <h2>Participants · {people.length}</h2>
        {locked ? null : (
          <button type="button" className={admin.link} onClick={() => open("new")}>
            ＋ Ajouter
          </button>
        )}
      </div>
      <div className={admin.list}>
        {people.map((p) => (
          <div key={p.id} className={admin.item}>
            <button type="button" className={admin.itemMain} onClick={() => open(p)}>
              <b>{p.firstName}</b>
              <span>{p.email}</span>
            </button>
            {locked ? null : (
              <button type="button" className={admin.icon} onClick={() => setRemoving(p)} aria-label={`Retirer ${p.firstName}`}>
                🗑
              </button>
            )}
          </div>
        ))}
        {people.length === 0 ? <p className={admin.hint}>Personne pour l&apos;instant. Commence par toi !</p> : null}
      </div>

      <Sheet open={editing !== null} onClose={close} title={editing === "new" ? "Ajouter quelqu'un" : "Modifier"}>
        <label className={sheetStyles.label} htmlFor="p-first">
          Prénom
        </label>
        <input id="p-first" className={sheetStyles.field} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="off" />
        <label className={sheetStyles.label} htmlFor="p-email">
          Email
        </label>
        <input
          id="p-email"
          className={sheetStyles.field}
          type="email"
          inputMode="email"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className={admin.hint}>Pense aussi à lui donner accès dans cf-admin (groupe secretsanta-users).</p>
        {confirmEdit && editing !== "new" && editing !== null ? (
          <p className={styles.error}>Modifier {editing.firstName} ? Le tirage ne change pas.</p>
        ) : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        <button type="button" className={styles.button} disabled={pending} onClick={save}>
          {editing === "new" ? "Ajouter" : confirmEdit ? "Oui, modifier" : "Enregistrer"}
        </button>
      </Sheet>

      <Sheet open={removing !== null} onClose={() => setRemoving(null)} title={`Retirer ${removing?.firstName ?? ""} ?`}>
        <p>Sa liste d&apos;envies et ses idées seront supprimées.</p>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button
          type="button"
          className={`${styles.button} ${styles.buttonBrick}`}
          disabled={pending}
          onClick={() => removing && run(() => removeParticipantAction(removing.id), () => setRemoving(null))}
        >
          Oui, retirer
        </button>
        <button type="button" className={`${styles.button} ${styles.buttonGhost}`} onClick={() => setRemoving(null)}>
          Annuler
        </button>
      </Sheet>
    </>
  );
}
