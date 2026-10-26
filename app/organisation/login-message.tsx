"use client";

import { useState } from "react";

import styles from "@/app/_components/card.module.css";

import admin from "./organisation.module.css";

export function loginMessage(appUrl: string): string {
  return [
    "Coucou ! Cette année, on fait un Père Noël secret en famille 🎄",
    `Voici le site : ${appUrl}`,
    "Pour entrer la première fois :",
    "1. Ouvre le lien",
    "2. Écris ton adresse email",
    "3. Recopie le code à 6 chiffres que tu reçois par email",
    "Ensuite, tu peux déjà écrire ta liste d'envies !",
  ].join("\n");
}

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
