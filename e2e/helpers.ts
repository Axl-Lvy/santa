import type { Browser, BrowserContextOptions, Page } from "@playwright/test";

export const ADMIN_PIN = "1234";

export const FAMILY = [
  { firstName: "Axel" },
  { firstName: "Léon" },
  { firstName: "Monique" },
  { firstName: "Bernard" },
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
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await page.getByRole("button", { name: p.firstName, exact: true }).waitFor();
  }
  await page.getByLabel("Première personne").selectOption({ label: "Monique" });
  await page.getByLabel("Deuxième personne").selectOption({ label: "Bernard" });
  await page.getByRole("button", { name: "＋ Ajouter" }).nth(1).click();
  await page.getByText("Monique✕Bernard").waitFor();
}
