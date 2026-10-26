import { expect, test } from "@playwright/test";

import { pageAs, seedFamily } from "./helpers";

test.describe.configure({ mode: "serial" });

test("the admin sets up the family and sees the checks", async ({ page }) => {
  await seedFamily(page);
  await expect(page.getByText("✅ Un tirage est possible avec ces règles")).toBeVisible();
  await expect(page.getByText(/Ton Père Noël reste un mystère/)).toBeVisible();
});

test("a wish refuses a javascript: link and accepts https", async ({ browser, contextOptions }) => {
  const leon = await pageAs(browser, contextOptions, "leon@test.fr");
  await leon.goto("/envies");
  await leon.getByRole("button", { name: "＋ Ajouter une envie" }).click();
  await leon.getByLabel("Qu'est-ce qui te ferait plaisir ?").fill("Un vinyle de jazz");
  await leon.getByLabel(/Un lien/).fill("javascript:alert(1)");
  await leon.getByRole("button", { name: "Ajouter à ma liste" }).click();
  await expect(leon.getByText("Le lien doit commencer par http:// ou https://")).toBeVisible();
  await leon.getByLabel(/Un lien/).fill("https://exemple.fr/vinyle");
  await leon.getByRole("button", { name: "Ajouter à ma liste" }).click();
  await expect(leon.getByRole("link", { name: "🔗 Voir le lien" })).toBeVisible();
});

test("a family message appears on another phone without reloading", async ({ browser, contextOptions }) => {
  const leon = await pageAs(browser, contextOptions, "leon@test.fr");
  const mamie = await pageAs(browser, contextOptions, "mamie@test.fr");
  await mamie.goto("/messages/famille");
  await leon.goto("/messages/famille");
  await mamie.waitForTimeout(1000);
  await leon.getByRole("textbox").fill("On fait ça chez Mamie ?");
  await leon.getByRole("button", { name: "Envoyer" }).click();
  await expect(mamie.getByText("On fait ça chez Mamie ?")).toBeVisible({ timeout: 5000 });
});

test("someone outside the family is told so", async ({ browser, contextOptions }) => {
  const stranger = await pageAs(browser, contextOptions, "inconnu@test.fr");
  await stranger.goto("/");
  await expect(stranger.getByText("Tu ne fais pas partie de ce tirage.")).toBeVisible();
});
