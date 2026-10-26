export type Participant = {
  id: number;
  firstName: string;
  email: string;
  revealedAt: string | null;
  drawEmailSentAt: string | null;
};

export type ParticipantRow = {
  id: number;
  first_name: string;
  email: string;
  revealed_at: string | null;
  draw_email_sent_at: string | null;
};

export const PARTICIPANT_COLUMNS = "id, first_name, email, revealed_at, draw_email_sent_at";

export function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    firstName: row.first_name,
    email: row.email,
    revealedAt: row.revealed_at,
    drawEmailSentAt: row.draw_email_sent_at,
  };
}
