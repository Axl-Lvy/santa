import type { Browser, BrowserContextOptions, Page } from "@playwright/test";

export const FAMILY = [
  { firstName: "Axel", email: "axel@test.fr" },
  { firstName: "Léon", email: "leon@test.fr" },
  { firstName: "Mamie", email: "mamie@test.fr" },
  { firstName: "Papa", email: "papa@test.fr" },
];

/** Switches the dev identity of this page's context. */
export async function as(page: Page, email: string): Promise<void> {
  await page.goto(`/api/dev/as?email=${encodeURIComponent(email)}`);
}

/** A fresh page acting as `email`. */
export async function pageAs(
  browser: Browser,
  options: BrowserContextOptions,
  email: string,
): Promise<Page> {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await as(page, email);
  return page;
}

/** Adds the family and one rule through the admin page. */
export async function seedFamily(page: Page): Promise<void> {
  await as(page, "axel@test.fr");
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
