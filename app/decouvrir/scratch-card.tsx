"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import cardStyles from "@/app/_components/card.module.css";
import { markRevealedAction } from "@/lib/actions/reveal";

import styles from "./decouvrir.module.css";
import { HINT_DELAY_MS, REVEAL_THRESHOLD, clearedRatio } from "./scratch";

const BRUSH = 18;

export function ScratchCard({ gifteeName }: { gifteeName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const [painted, setPainted] = useState(false);
  const touched = useRef(false);
  const moves = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);

  const done = useRef(false);
  const reveal = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setRevealed(true);
    void markRevealedAction();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    const gold = ctx.createLinearGradient(0, 0, width, height);
    gold.addColorStop(0, "#c9a24a");
    gold.addColorStop(0.5, "#e9c46a");
    gold.addColorStop(1, "#b8913c");
    ctx.fillStyle = gold;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#1f3b2d";
    ctx.font = "800 17px var(--font-nunito), system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✨ Gratte ici ✨", width / 2, height / 2 + 6);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = BRUSH * 2;
    // The name stays hidden until the gold layer covers it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPainted(true);

    const timer = setTimeout(() => {
      if (!touched.current) setHint(true);
    }, HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const check = () => {
    const canvas = canvasRef.current!;
    const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    if (clearedRatio(data) >= REVEAL_THRESHOLD) reveal();
  };

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const scratch = (to: { x: number; y: number }) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const from = last.current ?? to;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(to.x, to.y, BRUSH, 0, Math.PI * 2);
    ctx.fill();
    last.current = to;
  };

  return (
    <>
      <div className={styles.card}>
        <div>
          <div className={styles.label}>Tu fais un cadeau à</div>
          <div
            className={styles.name}
            aria-hidden={!painted || !revealed}
            style={painted ? undefined : { visibility: "hidden" }}
          >
            {gifteeName}
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className={`${styles.canvas} ${painted ? "" : styles.canvasUnpainted} ${revealed ? styles.canvasGone : ""}`}
          aria-label="Carte à gratter : frotte-la pour découvrir le prénom"
          role="img"
          onPointerDown={(e) => {
            touched.current = true;
            setHint(false);
            e.currentTarget.setPointerCapture(e.pointerId);
            last.current = null;
            scratch(point(e));
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            scratch(point(e));
            if (++moves.current % 8 === 0) check();
          }}
          onPointerUp={() => {
            last.current = null;
            check();
          }}
        />
        {hint && !revealed ? (
          <span className={styles.finger} aria-hidden>
            👆
          </span>
        ) : null}
      </div>

      {revealed ? (
        <div className={styles.after}>
          <p style={{ margin: 0 }}>🤫 C&apos;est un secret, ne le dis à personne !</p>
          <Link
            href="/mission"
            className={`${cardStyles.button}`}
            style={{ width: "auto", padding: "14px 22px" }}
          >
            Voir ses envies →
          </Link>
        </div>
      ) : (
        <button type="button" className={styles.help} onClick={reveal}>
          Je n&apos;y arrive pas, montre-moi
        </button>
      )}
    </>
  );
}
