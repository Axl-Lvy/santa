import Link from "next/link";

import styles from "@/app/_components/card.module.css";
import { adminChecks } from "@/lib/admin-checks";
import { getConfig } from "@/lib/config";
import { getDb } from "@/lib/db";
import { getEvent } from "@/lib/event";
import { listParticipants } from "@/lib/participants";
import { listRules } from "@/lib/rules";
import { requireAdmin } from "@/lib/viewer";

import { BudgetForm } from "./budget-form";
import { LoginMessage } from "./login-message";
import admin from "./organisation.module.css";
import { ParticipantForm } from "./participant-form";
import { RuleForm } from "./rule-form";

export const dynamic = "force-dynamic";

export default async function Organisation() {
  const viewer = await requireAdmin();
  const db = getDb();
  const people = listParticipants(db).map(({ id, firstName, email }) => ({ id, firstName, email }));
  const rules = listRules(db).map(([a, b]) => [a, b] as [number, number]);
  const { budgetEur } = getEvent(db);
  const checks = adminChecks(db, viewer.email);

  return (
    <main className={styles.page} style={{ paddingBottom: 40 }}>
      <Link href="/" className={styles.back}>
        ‹ Accueil
      </Link>
      <h1 className={styles.title}>
        <span className={styles.kicker}>Organisation</span>
        Préparer le tirage
      </h1>

      <ParticipantForm people={people} locked={false} />
      <RuleForm people={people} rules={rules} />
      <BudgetForm budgetEur={budgetEur} />

      <div>
        <div className={admin.check}>
          {checks.drawPossible ? "✅ Un tirage est possible avec ces règles" : "⚠️ Aucun tirage n'est possible pour l'instant"}
        </div>
        {checks.mystery ? (
          <div className={`${admin.check} ${checks.mystery.warn ? admin.checkWarn : ""}`}>
            {checks.mystery.warn ? "⚠️" : "✅"} Ton Père Noël reste un mystère ({checks.mystery.count}{" "}
            {checks.mystery.count > 1 ? "personnes possibles" : "personne possible"})
          </div>
        ) : null}
      </div>
      <button type="button" className={`${styles.button} ${styles.buttonBrick}`} disabled>
        Lancer le tirage 🎲
      </button>

      <LoginMessage appUrl={getConfig().appUrl} />
    </main>
  );
}
