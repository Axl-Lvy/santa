"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import styles from "./dev-switcher.module.css";

type Person = { firstName: string; email: string; revealed: boolean };

export function DevSwitcherPanel({
  current,
  people,
  adminEmail,
}: {
  current: string;
  people: Person[];
  adminEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const currentName = people.find((p) => p.email === current)?.firstName ?? current;

  // A full navigation on purpose: the API route sets the cookie, then redirects back here.
  const switchHref = (email: string) =>
    `/api/dev/as?email=${encodeURIComponent(email)}&next=${encodeURIComponent(pathname)}`;

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
          {people.map((p) => (
            <a
              key={p.email}
              href={switchHref(p.email)}
              className={styles.person}
              aria-current={p.email === current}
            >
              <span>
                {p.firstName}
                {p.email === adminEmail ? " 👑" : ""}
              </span>
              <span className={styles.meta}>{p.revealed ? "a gratté" : p.email}</span>
            </a>
          ))}
          {people.length === 0 ? (
            <p className={styles.meta}>Personne encore : ajoute des gens dans Organisation.</p>
          ) : null}
          <form className={styles.form} action="/api/dev/as" method="get">
            <input type="hidden" name="next" value={pathname} />
            <input
              type="email"
              name="email"
              required
              placeholder="autre email…"
              aria-label="Autre email"
            />
            <button type="submit">OK</button>
          </form>
          <div className={styles.links}>
            <a className={styles.link} href="/organisation">
              Organisation
            </a>
            <a className={styles.link} href="/api/dev/outbox" target="_blank" rel="noreferrer">
              Emails envoyés
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
