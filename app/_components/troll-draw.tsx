"use client";

import { useState } from "react";

import styles from "./troll-draw.module.css";
import { TrollReveal, type TrollPerson } from "./troll-reveal";

type Props = {
  people: TrollPerson[];
  onPick: (title: string, forPerson: TrollPerson) => void;
  /** `page` = banner on Idées; `inline` = link inside the sheet. */
  variant?: "page" | "inline";
};

/** Entry point for the doubtful-inspiration draw (page CTA or sheet link). */
export function TrollDraw({ onPick, people, variant = "inline" }: Props) {
  const [open, setOpen] = useState(false);

  if (people.length === 0) return null;

  return (
    <>
      <div className={styles.block}>
        {variant === "page" ? (
          <button type="button" className={styles.pageCta} onClick={() => setOpen(true)}>
            <span className={styles.ctaIcon} aria-hidden>
              🎁
            </span>
            <span className={styles.ctaText}>
              <span className={styles.ctaTitle}>Trouver une idée cadeau</span>
              <span className={styles.ctaSub}>En panne d&apos;inspiration ? L&apos;algorithme s&apos;en charge.</span>
            </span>
            <span className={styles.ctaArrow} aria-hidden>
              →
            </span>
          </button>
        ) : (
          <button type="button" className={styles.start} onClick={() => setOpen(true)}>
            Trouver une idée cadeau
          </button>
        )}
      </div>
      {open ? (
        <TrollReveal
          people={people}
          onClose={() => setOpen(false)}
          onPick={(title, forPerson) => {
            onPick(title, forPerson);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
