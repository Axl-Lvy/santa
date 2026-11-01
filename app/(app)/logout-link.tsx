"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { logoutAction } from "@/lib/actions/session";

/** Logs this browser out, for a device shared by several guests. */
export function LogoutLink() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logoutAction();
          router.refresh();
        })
      }
      style={{
        alignSelf: "center",
        background: "none",
        border: 0,
        padding: 12,
        color: "inherit",
        opacity: 0.6,
        textDecoration: "underline",
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      Ce n&apos;est pas moi
    </button>
  );
}
