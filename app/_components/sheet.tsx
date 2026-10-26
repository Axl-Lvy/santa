"use client";

import { useEffect, useRef, type ReactNode } from "react";

import styles from "./sheet.module.css";

export { styles as sheetStyles };

/** A bottom sheet on a native modal dialog: focus trap and Escape come with it. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.grab} aria-hidden />
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.body}>{children}</div>
    </dialog>
  );
}
