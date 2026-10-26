import { digestEmail, drawEmail } from "./templates";

const appUrl = "https://santa.axl-lvy.fr";
const neutral = (m: { subject: string; text: string; html: string }, name: string) =>
  JSON.stringify(m).replaceAll(name, "X");

describe("draw email", () => {
  it("is identical for every recipient apart from their first name (rule 8)", () => {
    expect(neutral(drawEmail({ firstName: "Camille", budgetEur: 30, appUrl }), "Camille")).toBe(
      neutral(drawEmail({ firstName: "Léon", budgetEur: 30, appUrl }), "Léon"),
    );
  });

  it("carries the agreed copy and link", () => {
    const m = drawEmail({ firstName: "Camille", budgetEur: 30, appUrl });
    expect(m.subject).toBe("🎲 Le tirage a eu lieu !");
    expect(m.text).toContain(
      "Bonjour Camille, le tirage est fait. Ouvre le site et gratte ton ticket pour découvrir à qui tu fais un cadeau.",
    );
    expect(m.text).toContain("Budget : environ 30 €.");
    expect(m.text).toContain("Gratter mon ticket");
    expect(m.text).toContain("Ne transfère pas cet email : le nom n'est que sur le site 🤫");
    expect(m.text).toContain(`${appUrl}/decouvrir`);
    expect(m.html).toContain(`href="${appUrl}/decouvrir"`);
  });

  it("omits the budget line without a budget", () => {
    expect(drawEmail({ firstName: "Camille", budgetEur: null, appUrl }).text).not.toContain("Budget");
  });

  it("escapes the first name in html", () => {
    expect(drawEmail({ firstName: "<b>Jo</b>", budgetEur: null, appUrl }).html).not.toContain("<b>Jo</b>");
  });
});

describe("digest email", () => {
  it("carries the agreed copy and no other name", () => {
    const m = digestEmail({ firstName: "Camille", appUrl });
    expect(m.subject).toBe("✨ Du nouveau sur le Père Noël secret");
    expect(m.text).toContain("Bonjour Camille, il y a du nouveau dans la discussion de famille depuis ta dernière visite.");
    expect(m.text).toContain("Voir sur le site");
    expect(neutral(m, "Camille")).toBe(neutral(digestEmail({ firstName: "Léon", appUrl }), "Léon"));
  });
});
