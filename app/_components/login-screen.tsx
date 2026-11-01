"use client";

import { useState, type FormEvent } from "react";

import { loginAction } from "@/lib/actions/session";

import styles from "./card.module.css";
import sheet from "./sheet.module.css";
import { useAction } from "./use-action";

/** The first-name login, shown in place of any page to a browser without a session. */
export function LoginScreen() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [askPin, setAskPin] = useState(false);
  const { pending, error, run } = useAction();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(
      () => loginAction(name, askPin ? pin : ""),
      // A full reload so the page, its gates and its live updates start over as the guest.
      (outcome) => (outcome === "pin" ? setAskPin(true) : window.location.reload()),
    );
  };

  return (
    <main className={styles.page} style={{ minHeight: "100dvh", justifyContent: "center" }}>
      <div style={{ fontSize: 48, textAlign: "center" }} aria-hidden>
        🎄
      </div>
      <h1 className={styles.title} style={{ textAlign: "center" }}>
        <span className={styles.kicker}>Noël 2026</span>
        Père Noël secret
      </h1>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label className={sheet.label} htmlFor="login-name">
          Ton prénom
        </label>
        <input
          id="login-name"
          className={sheet.field}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setAskPin(false);
          }}
          autoComplete="given-name"
          maxLength={40}
          required
          style={{ fontSize: 16 }}
        />
        {askPin ? (
          <>
            <label className={sheet.label} htmlFor="login-pin">
              Code secret
            </label>
            <input
              id="login-pin"
              className={sheet.field}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              autoFocus
              required
              style={{ fontSize: 16 }}
            />
          </>
        ) : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        <button type="submit" className={styles.button} disabled={pending}>
          Entrer
        </button>
      </form>
    </main>
  );
}
