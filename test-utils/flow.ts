import { postAnon } from "@/lib/anon-messages";
import { gifteeOf } from "@/lib/assignment";
import type { Db } from "@/lib/db";
import { runDraw } from "@/lib/draw";
import { postGroupMessage } from "@/lib/group-messages";
import { addIdea } from "@/lib/ideas";
import { devOutbox, type Mail } from "@/lib/mail/transport";
import { runDigestTick } from "@/lib/mail/digest";
import { getParticipant } from "@/lib/participants";
import { addRule } from "@/lib/rules";
import { setNow } from "@/lib/time";
import { addWish } from "@/lib/wishes";

import { seedParticipants } from "./db";

const NAMES = ["Axel", "Léon", "Mamie", "Papa", "Julie", "Théo", "Sophie", "Camille"];

/** Runs a whole event with unique markers; returns the markers that must never appear in clear. */
export async function runFullFlow(db: Db): Promise<{ secrets: string[]; mailsDuringAnonymous: Mail[]; digestMails: Mail[] }> {
  const people = seedParticipants(db, NAMES).map((p) => getParticipant(db, p.id)!);
  addRule(db, people[0].id, people[1].id);
  addRule(db, people[2].id, people[3].id);

  setNow(new Date("2026-12-01T07:00:00Z"));
  people.forEach((p, n) => postGroupMessage(db, p, `GROUP-${n}`));
  runDraw(db);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const secrets: string[] = [];
  const before = devOutbox().length;
  people.forEach((p, n) => {
    const me = getParticipant(db, p.id)!;
    postAnon(db, me, "giftee", `SECRET-A-${n}`);
    postAnon(db, me, "santa", `SECRET-B-${n}`);
    addWish(db, me.id, { title: `WISH-${n}`, detail: "", url: "" });
    const target = people.find((o) => o.id !== me.id && o.id !== gifteeOf(db, me.id))!;
    addIdea(db, me.id, target.id, `SECRET-I-${n}`);
    secrets.push(`SECRET-A-${n}`, `SECRET-B-${n}`, `SECRET-I-${n}`);
  });
  const mailsDuringAnonymous = devOutbox().slice(before);

  const digestMails: Mail[] = [];
  await runDigestTick(db, new Date("2026-12-01T10:00:00Z"), async (m) => {
    digestMails.push(m);
  });
  setNow(null);
  return { secrets, mailsDuringAnonymous, digestMails };
}
