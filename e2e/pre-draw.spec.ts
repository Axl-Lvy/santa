import { expect, test } from "@playwright/test";

import { login, pageAs, seedFamily } from "./helpers";

test.describe.configure({ mode: "serial" });

test("the admin sets up the family and sees the checks", async ({ page }) => {
  await seedFamily(page);
  await expect(page.getByText("✅ Un tirage est possible avec ces règles")).toBeVisible();
  await expect(page.getByText(/Ton Père Noël reste un mystère/)).toBeVisible();
});

test("a wish refuses a javascript: link and accepts https", async ({ browser, contextOptions }) => {
  const leon = await pageAs(browser, contextOptions, "Léon");
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

test("a family message appears on another phone without reloading", async ({
  browser,
  contextOptions,
}) => {
  const leon = await pageAs(browser, contextOptions, "Léon");
  const monique = await pageAs(browser, contextOptions, "Monique");
  await monique.goto("/messages/famille");
  await leon.goto("/messages/famille");
  await monique.waitForTimeout(1000);
  await leon.getByRole("textbox").fill("On fait ça chez Mamie ?");
  await leon.getByRole("button", { name: "Envoyer" }).click();
  await expect(monique.getByText("On fait ça chez Mamie ?")).toBeVisible({ timeout: 5000 });
});

test("an unknown name is told so", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Ton prénom").fill("Zorro");
  await page.getByRole("button", { name: "Entrer" }).click();
  await expect(page.getByText("Je ne te trouve pas.", { exact: false })).toBeVisible();
});

test("a name typed without accents logs in", async ({ page }) => {
  await login(page, "leon");
  await expect(page.getByText("Bonjour Léon")).toBeVisible();
});

test("Axel without the right code stays out", async ({ page }) => {
  await page.goto("/organisation");
  await page.getByLabel("Ton prénom").fill("axel");
  await page.getByRole("button", { name: "Entrer" }).click();
  await page.getByLabel("Code secret").fill("0000");
  await page.getByRole("button", { name: "Entrer" }).click();
  await expect(page.getByText("Ce n'est pas le bon code.")).toBeVisible();
  await expect(page.getByText("Préparer le tirage")).toHaveCount(0);
});
