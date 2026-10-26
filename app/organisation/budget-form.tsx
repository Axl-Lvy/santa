"use client";

import { useState } from "react";

import styles from "@/app/_components/card.module.css";
import { useAction } from "@/app/_components/use-action";
import { setBudgetAction } from "@/lib/actions/admin";

import admin from "./organisation.module.css";

export function BudgetForm({ budgetEur }: { budgetEur: number | null }) {
  const [value, setValue] = useState(budgetEur === null ? "" : String(budgetEur));
  const { error, run } = useAction();
  return (
    <>
      <div className={admin.sectionHead}>
        <h2>Budget</h2>
      </div>
      <div className={admin.list}>
        <label className={admin.budget}>
          Par cadeau, environ
          <span>
            <input
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => run(() => setBudgetAction(value))}
              aria-label="Budget en euros"
            />{" "}
            €
          </span>
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </>
  );
}
