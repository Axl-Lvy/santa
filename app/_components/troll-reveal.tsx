"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { shuffleDeck, type TrollGift } from "@/lib/troll-gifts";

import card from "./card.module.css";
import styles from "./troll-reveal.module.css";

export type TrollPerson = { id: number; firstName: string };

type Phase = "pick" | "hype" | "flash" | "reveal";

const FLASH_MS = 700;

const SPARKLES = [
  { top: "12%", left: "18%", delay: "0s" },
  { top: "22%", left: "78%", delay: "0.4s" },
  { top: "38%", left: "10%", delay: "1.1s" },
  { top: "48%", left: "88%", delay: "0.7s" },
  { top: "68%", left: "22%", delay: "1.6s" },
  { top: "74%", left: "72%", delay: "0.2s" },
  { top: "16%", left: "52%", delay: "1.3s" },
  { top: "58%", left: "48%", delay: "0.9s" },
];

type Props = {
  people: TrollPerson[];
  onClose: () => void;
  onPick: (title: string, forPerson: TrollPerson) => void;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function takeOne(remaining: TrollGift[]): { gift: TrollGift; rest: TrollGift[] } {
  const pool = remaining.length > 0 ? remaining : shuffleDeck();
  const [gift, ...rest] = pool;
  return { gift, rest };
}

function beatsFor(name: string): { stage: string; line: string; holdMs: number }[] {
  return [
    {
      stage: "Acte I",
      line: `Analyse du profil de ${name}…`,
      holdMs: 2400,
    },
    {
      stage: "Acte II",
      line: "Croisement avec les archives secrètes du Père Noël…",
      holdMs: 2600,
    },
    {
      stage: "Acte III",
      line: `Calibration fine des goûts de ${name}…`,
      holdMs: 2600,
    },
    {
      stage: "Final",
      line: "Prépare-toi. Ça va être énorme.",
      holdMs: 2800,
    },
  ];
}

/** Full-screen fake “who for?” → pack ceremony → pourri gift. */
export function TrollReveal({ people, onClose, onPick }: Props) {
  const titleId = useId();
  const deckRef = useRef<TrollGift[] | null>(null);
  const runRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const [phase, setPhase] = useState<Phase>("pick");
  const [forPerson, setForPerson] = useState<TrollPerson | null>(null);
  const [beat, setBeat] = useState(0);
  const [progress, setProgress] = useState(0);
  const [gift, setGift] = useState<TrollGift | null>(null);
  const [runId, setRunId] = useState(0);

  const beats = forPerson ? beatsFor(forPerson.firstName) : [];

  const deck = () => {
    deckRef.current ??= shuffleDeck();
    return deckRef.current;
  };

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (runId === 0 || !forPerson) return;

    const run = ++runRef.current;
    const script = beatsFor(forPerson.firstName);
    const hypeMs = script.reduce((sum, b) => sum + b.holdMs, 0);
    const { gift: next, rest } = takeOne(deck());
    deckRef.current = rest;
    setGift(next);
    setBeat(0);
    setProgress(0);
    setPhase("hype");

    if (prefersReducedMotion()) {
      setPhase("reveal");
      setProgress(100);
      return;
    }

    const timers: number[] = [];
    let t = 0;
    for (let i = 0; i < script.length; i++) {
      const start = t;
      if (i > 0) {
        timers.push(
          window.setTimeout(() => {
            if (run !== runRef.current) return;
            setBeat(i);
          }, start),
        );
      }
      timers.push(
        window.setTimeout(() => {
          if (run !== runRef.current) return;
          setProgress(Math.round(((i + 1) / script.length) * 92));
        }, start + script[i].holdMs * 0.85),
      );
      t += script[i].holdMs;
    }

    timers.push(
      window.setTimeout(() => {
        if (run !== runRef.current) return;
        setPhase("flash");
        setProgress(100);
      }, hypeMs),
    );
    timers.push(
      window.setTimeout(() => {
        if (run !== runRef.current) return;
        setPhase("reveal");
      }, hypeMs + FLASH_MS),
    );

    return () => {
      runRef.current++;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [runId, forPerson]);

  const startFor = (person: TrollPerson) => {
    setForPerson(person);
    setRunId((n) => n + 1);
  };

  const skipToReveal = () => {
    runRef.current++;
    if (!gift) {
      const { gift: next, rest } = takeOne(deck());
      deckRef.current = rest;
      setGift(next);
    }
    setPhase("reveal");
    setProgress(100);
  };

  const encore = () => {
    if (!forPerson) {
      setPhase("pick");
      return;
    }
    setRunId((n) => n + 1);
  };

  const current = beats[beat] ?? beats[0];

  return createPortal(
    <div
      className={`${styles.overlay} ${phase === "hype" ? styles.intensity : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button type="button" className={styles.close} onClick={onClose}>
        Fermer
      </button>

      {phase === "hype" || phase === "flash"
        ? SPARKLES.map((s, i) => (
            <span
              key={i}
              className={styles.sparkle}
              style={{ top: s.top, left: s.left, animationDelay: s.delay }}
              aria-hidden
            />
          ))
        : null}

      {phase === "flash" ? <div className={styles.flash} aria-hidden /> : null}

      {phase === "pick" ? (
        <div className={styles.pick}>
          <p className={styles.stage}>Étape 1</p>
          <h2 className={styles.pickTitle} id={titleId}>
            Pour qui cherche-t-on l&apos;idée ?
          </h2>
          <p className={styles.pickSub}>L&apos;algorithme va tout calculer. Ou presque.</p>
          <div className={styles.people} role="group" aria-label="Choisir une personne">
            {people.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.person}
                onClick={() => startFor(p)}
              >
                <span className={styles.circle} aria-hidden>
                  {p.firstName.charAt(0).toUpperCase()}
                </span>
                {p.firstName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "reveal" && gift && forPerson ? (
        <div className={styles.reveal}>
          <p className={styles.anticlimax} id={titleId}>
            …ah. Voilà. Pour {forPerson.firstName}.
          </p>
          <div className={styles.card}>
            <div className={styles.cardEmoji} aria-hidden>
              🥴
            </div>
            <p className={styles.cardTitle}>{gift.title}</p>
            <p className={styles.cardRoast}>{gift.roast}</p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${card.button} ${card.buttonBrick}`}
              onClick={() => onPick(gift.title, forPerson)}
            >
              Prendre ça
            </button>
            <button type="button" className={`${card.button} ${styles.ghost}`} onClick={encore}>
              Encore (oser)
            </button>
            <button
              type="button"
              className={styles.skip}
              onClick={() => {
                runRef.current++;
                setForPerson(null);
                setGift(null);
                setPhase("pick");
              }}
            >
              Changer de personne
            </button>
          </div>
        </div>
      ) : null}

      {(phase === "hype" || phase === "flash") && current ? (
        <div className={styles.hype}>
          <p className={styles.stage}>{current.stage}</p>
          <div className={styles.boxWrap} aria-hidden>
            <span className={styles.ring} />
            <span className={`${styles.ring} ${styles.ringSlow}`} />
            <div className={styles.box}>
              <span className={styles.lid} />
              <span className={styles.ribbonV} />
              <span className={styles.ribbonH} />
              <span className={styles.bow} />
              <span className={styles.boxGlow} />
            </div>
          </div>
          <p key={`${forPerson?.id}-${beat}`} className={styles.hypeLine} id={titleId}>
            {current.line}
          </p>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Cérémonie d'inspiration"
          >
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>
          <button type="button" className={styles.skip} onClick={skipToReveal}>
            Passer
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
