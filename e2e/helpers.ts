import type { Browser, BrowserContextOptions, Page } from "@playwright/test";

export const ADMIN_PIN = "1234";

export const FAMILY = [
  { firstName: "Axel", email: "axel@test.fr" },
  { firstName: "Léon", email: "leon@test.fr" },
  { firstName: "Mamie", email: "mamie@test.fr" },
  { firstName: "Papa", email: "papa@test.fr" },
];

/** Logs this page's browser in through the first-name screen (Axel with the PIN). */
export async function login(page: Page, name: string): Promise<void> {
  await page.goto("/");
  await page.getByLabel("Ton prénom").fill(name);
  if (name === "Axel") {
    await page.getByRole("button", { name: "Entrer" }).click();
    await page.getByLabel("Code secret").fill(ADMIN_PIN);
  }
  const reloaded = page.waitForEvent("load");
  await page.getByRole("button", { name: "Entrer" }).click();
  await reloaded;
}

/** A fresh page logged in as `name`. */
export async function pageAs(
  browser: Browser,
  options: BrowserContextOptions,
  name: string,
): Promise<Page> {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await login(page, name);
  return page;
}

/** Adds the family and one rule through the admin page. */
export async function seedFamily(page: Page): Promise<void> {
  await login(page, "Axel");
  await page.goto("/organisation");
  for (const p of FAMILY) {
    await page.getByRole("button", { name: "＋ Ajouter" }).first().click();
    await page.getByLabel("Prénom").fill(p.firstName);
    await page.getByLabel("Email").fill(p.email);
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await page.getByText(p.email).waitFor();
  }
  await page.getByLabel("Première personne").selectOption({ label: "Mamie" });
  await page.getByLabel("Deuxième personne").selectOption({ label: "Papa" });
  await page.getByRole("button", { name: "＋ Ajouter" }).nth(1).click();
  await page.getByText("Mamie✕Papa").waitFor();
}
