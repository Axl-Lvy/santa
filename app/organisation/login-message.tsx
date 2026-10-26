"use client";

import { useState } from "react";

import styles from "@/app/_components/card.module.css";
import { loginMessage } from "@/lib/login-message";

import admin from "./organisation.module.css";

export function LoginMessage({ appUrl }: { appUrl: string }) {
  const [copied, setCopied] = useState(false);
  const text = loginMessage(appUrl);
  return (
    <>
      <div className={admin.sectionHead}>
        <h2>Le message à envoyer avec le lien</h2>
      </div>
      <p className={admin.message}>{text}</p>
      <button
        type="button"
        className={`${styles.button} ${styles.buttonGhost}`}
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        }}
      >
        {copied ? "Copié ✔" : "Copier"}
      </button>
    </>
  );
}
