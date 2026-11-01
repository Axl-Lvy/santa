"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import styles from "./dev-switcher.module.css";

type Person = { id: number; firstName: string; revealed: boolean };

export function DevSwitcherPanel({
  currentId,
  people,
}: {
  currentId: number | null;
  people: Person[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const currentName = people.find((p) => p.id === currentId)?.firstName ?? "Moi";

  // A full navigation on purpose: the API route sets the cookie, then redirects back here.
  const switchHref = (id: number | "", next = pathname) =>
    `/api/dev/as?id=${id}&next=${encodeURIComponent(next)}`;

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        🧪 {currentName}
      </button>
      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Changer de compte (test)">
          <p className={styles.title}>Test : être quelqu&apos;un d&apos;autre</p>
          <a href={switchHref("")} className={styles.person}>
            <span>Moi 👑</span>
          </a>
          {people.map((p) => (
            <a
              key={p.id}
              href={switchHref(p.id)}
              className={styles.person}
              aria-current={p.id === currentId}
            >
              <span>{p.firstName}</span>
              <span className={styles.meta}>{p.revealed ? "a gratté" : ""}</span>
            </a>
          ))}
          {people.length === 0 ? (
            <p className={styles.meta}>Personne encore : ajoute des gens dans Organisation.</p>
          ) : null}
          <div className={styles.links}>
            <a className={styles.link} href={switchHref("", "/organisation")}>
              Organisation
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
