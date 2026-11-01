import { describeDevice } from "@/lib/device";
import type { LoginEvent } from "@/lib/session";

import admin from "./organisation.module.css";

const when = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Every login and failed admin code, newest first, for the admin to watch. */
export function LoginLog({ events }: { events: LoginEvent[] }) {
  return (
    <>
      <div className={admin.sectionHead}>
        <h2>Connexions</h2>
      </div>
      <div className={admin.list}>
        {events.map((e) => (
          <details key={e.id} className={admin.logEntry}>
            <summary>
              <span className={e.ok ? admin.statusOk : admin.statusNo}>{e.ok ? "✔" : "✖"}</span>
              <b>{e.name}</b>
              {e.ok ? null : <span className={admin.statusNo}>code faux</span>}
              <span className={admin.logMeta}>
                {when.format(new Date(e.at))} · {describeDevice(e.userAgent)}
                {e.ip ? ` · ${e.ip}` : ""}
                {e.country ? ` · ${e.country}` : ""}
              </span>
            </summary>
            <p className={admin.logRaw}>{e.userAgent ?? "Pas d'information sur l'appareil."}</p>
          </details>
        ))}
        {events.length === 0 ? (
          <p className={admin.hint} style={{ padding: "12px 0" }}>
            Personne ne s&apos;est encore connecté.
          </p>
        ) : null}
      </div>
    </>
  );
}
