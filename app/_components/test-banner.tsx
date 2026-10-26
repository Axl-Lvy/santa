import { getConfig } from "@/lib/config";

/** A banner on every page of a test site, so it is never mistaken for the real one. */
export function TestBanner() {
  if (!getConfig().impersonation) return null;
  return (
    <div
      role="status"
      style={{
        background: "#7c3aed",
        color: "#fff",
        textAlign: "center",
        font: "700 13px/1.3 system-ui, sans-serif",
        padding: "6px 12px",
      }}
    >
      🧪 Site de test : rien n&apos;est réel, aucun email n&apos;est envoyé.
    </div>
  );
}
