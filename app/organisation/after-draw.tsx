"use client";

import styles from "@/app/_components/card.module.css";
import { useAction } from "@/app/_components/use-action";
import type { AdminStatusRow } from "@/lib/admin-checks";
import { resendDrawEmailAction } from "@/lib/actions/admin";

import admin from "./organisation.module.css";

const LABEL: Record<AdminStatusRow["status"], string> = {
  revealed: "✔ découvert",
  pending: "pas encore",
  "email-not-sent": "email pas encore envoyé",
};

export function AfterDraw({ drawnOn, rows }: { drawnOn: string; rows: AdminStatusRow[] }) {
  const { pending, error, run } = useAction();
  return (
    <>
      <div className={styles.hero} style={{ fontSize: 14 }}>
        Tirage effectué le {drawnOn}. Personne, pas même toi, ne peut voir qui a tiré qui.
      </div>
      <div className={admin.sectionHead}>
        <h2>Qui a gratté son ticket ?</h2>
      </div>
      <div className={admin.list}>
        {rows.map((r) => (
          <div key={r.id} className={admin.item}>
            <span className={admin.pair}>{r.firstName}</span>
            <span className={r.status === "revealed" ? admin.statusOk : admin.statusNo}>
              {LABEL[r.status]}
            </span>
            {r.status === "revealed" ? null : (
              <button
                type="button"
                className={admin.link}
                disabled={pending}
                onClick={() => run(() => resendDrawEmailAction(r.id))}
              >
                renvoyer l&apos;email
              </button>
            )}
          </div>
        ))}
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </>
  );
}
