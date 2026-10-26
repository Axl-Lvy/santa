import type { Mail } from "./transport";

type Content = Omit<Mail, "to">;

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/** Table-based HTML in the Veillée colours; every argument but `paragraphs` is fixed copy. */
function layout(o: {
  emoji: string;
  heading: string;
  paragraphs: string[];
  button: string;
  href: string;
  footer?: string;
}): string {
  const p = o.paragraphs
    .map((t) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1f3b2d">${t}</p>`)
    .join("");
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#f6efe3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6efe3"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:Nunito,Helvetica,Arial,sans-serif">
<tr><td style="background:#1f3b2d;border-radius:18px;padding:22px;text-align:center;color:#f6efe3">
<div style="font-size:34px">${o.emoji}</div>
<div style="font-family:Georgia,serif;font-size:22px;font-weight:bold;margin-top:4px">${o.heading}</div>
</td></tr>
<tr><td style="padding:20px 4px 4px">${p}</td></tr>
<tr><td style="padding:4px"><a href="${o.href}" style="display:block;background:#a6402b;color:#ffffff;border-radius:14px;padding:14px;text-align:center;font-weight:bold;font-size:16px;text-decoration:none">${o.button}</a></td></tr>
${o.footer ? `<tr><td style="padding:16px 4px;font-size:12px;color:#8a8a7a;text-align:center">${o.footer}</td></tr>` : ""}
</table></td></tr></table></body></html>`;
}

export function drawEmail({
  firstName,
  budgetEur,
  appUrl,
}: {
  firstName: string;
  budgetEur: number | null;
  appUrl: string;
}): Content {
  const href = `${appUrl}/decouvrir`;
  const intro = `Bonjour ${firstName}, le tirage est fait. Ouvre le site et gratte ton ticket pour découvrir à qui tu fais un cadeau.`;
  const budget = budgetEur === null ? null : `Budget : environ ${budgetEur} €.`;
  const footer = "Ne transfère pas cet email : le nom n'est que sur le site 🤫";
  return {
    subject: "🎲 Le tirage a eu lieu !",
    text: [intro, budget, `Gratter mon ticket : ${href}`, footer].filter(Boolean).join("\n\n"),
    html: layout({
      emoji: "🎫",
      heading: "Ton ticket t'attend",
      paragraphs: [escape(intro), ...(budget ? [escape(budget)] : [])],
      button: "Gratter mon ticket",
      href,
      footer: escape(footer),
    }),
  };
}

export function digestEmail({ firstName, appUrl }: { firstName: string; appUrl: string }): Content {
  const intro = `Bonjour ${firstName}, il y a du nouveau dans la discussion de famille depuis ta dernière visite.`;
  return {
    subject: "✨ Du nouveau sur le Père Noël secret",
    text: [intro, `Voir sur le site : ${appUrl}`].join("\n\n"),
    html: layout({
      emoji: "✨",
      heading: "Du nouveau t'attend",
      paragraphs: [escape(intro)],
      button: "Voir sur le site",
      href: appUrl,
    }),
  };
}
