import { seedParticipants, testDb } from "@/test-utils/db";

import { getParticipant } from "../participants";
import { resendDrawEmail, sendDrawEmails } from "./draw-emails";

describe("sendDrawEmails", () => {
  it("retries and records the send", async () => {
    const db = testDb();
    const [a] = seedParticipants(db, ["Camille"]);
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("x"))
      .mockRejectedValueOnce(new Error("x"))
      .mockResolvedValue(undefined);
    await sendDrawEmails(db, send, [0, 0, 0]);
    expect(send).toHaveBeenCalledTimes(3);
    expect(getParticipant(db, a.id)!.drawEmailSentAt).not.toBeNull();
  });

  it("leaves the flag unset when every attempt fails", async () => {
    const db = testDb();
    const [a] = seedParticipants(db, ["Camille"]);
    await sendDrawEmails(db, vi.fn().mockRejectedValue(new Error("x")), [0, 0, 0]);
    expect(getParticipant(db, a.id)!.drawEmailSentAt).toBeNull();
  });

  it("sends each person their own mail naming only them (rule 8)", async () => {
    const db = testDb();
    const people = seedParticipants(db, ["Camille", "Léon", "Mamie"]);
    const send = vi.fn().mockResolvedValue(undefined);
    await sendDrawEmails(db, send, [0]);
    for (const p of people) {
      const mail = send.mock.calls.map((c) => c[0]).find((m) => m.to === p.email);
      const others = people.filter((o) => o.id !== p.id).map((o) => o.firstName);
      for (const name of others) expect(JSON.stringify(mail)).not.toContain(name);
      expect(mail.text).toContain(`Bonjour ${p.firstName}`);
    }
  });

  it("skips people already mailed, but resend always sends", async () => {
    const db = testDb();
    const [a] = seedParticipants(db, ["Camille"]);
    const send = vi.fn().mockResolvedValue(undefined);
    await sendDrawEmails(db, send, [0]);
    await sendDrawEmails(db, send, [0]);
    expect(send).toHaveBeenCalledTimes(1);
    await resendDrawEmail(db, a.id, send);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
