import { expect, test, type Page } from "@playwright/test";

import { FAMILY, pageAs } from "./helpers";

test.describe.configure({ mode: "serial" });

test("the admin launches the draw once, even with a double tap", async ({ page, request }) => {
  await page.goto("/api/dev/as?email=axel@test.fr");
  await page.goto("/organisation");
  await page.getByRole("button", { name: "Lancer le tirage 🎲" }).click();
  await page.getByRole("button", { name: "Oui, lancer le tirage" }).dblclick();
  await expect(page.getByText("Le tirage est fait 🎉")).toBeVisible();
  await expect
    .poll(async () => (await (await request.get("/api/dev/outbox")).json()).length)
    .toBe(FAMILY.length);
  const mails = (await (await request.get("/api/dev/outbox")).json()) as {
    to: string;
    text: string;
  }[];
  const neutral = mails.map((m) => {
    const me = FAMILY.find((p) => p.email === m.to)!;
    return m.text.replaceAll(me.firstName, "X");
  });
  expect(new Set(neutral).size).toBe(1);
  await expect(page.locator("body")).not.toContainText("fait un cadeau à");
});

test("each person reveals, and a second phone does not replay it", async ({
  browser,
  contextOptions,
}) => {
  for (const p of FAMILY) {
    const page = await pageAs(browser, contextOptions, p.email);
    await page.goto("/");
    await expect(page).toHaveURL(/\/decouvrir$/);
    await page.getByRole("button", { name: "Je n'y arrive pas, montre-moi" }).click();
    await expect(page.getByText("C'est un secret, ne le dis à personne !")).toBeVisible();
  }
  const second = await pageAs(browser, contextOptions, "leon@test.fr");
  await second.goto("/decouvrir");
  await expect(second).toHaveURL(/\/$/);
  await expect(second.getByText("Cette année, tu fais un cadeau à")).toBeVisible();
});

test("a Santa's message reaches exactly their giftee, live", async ({
  browser,
  contextOptions,
}) => {
  const others: Page[] = [];
  for (const p of FAMILY.filter((x) => x.email !== "leon@test.fr")) {
    const page = await pageAs(browser, contextOptions, p.email);
    await page.goto("/messages/pere-noel");
    others.push(page);
  }
  const leon = await pageAs(browser, contextOptions, "leon@test.fr");
  await leon.goto("/messages/mission");
  await others[0].waitForTimeout(1000);
  await leon.getByRole("textbox").fill("Tu préfères le thé ou le café ?");
  await leon.getByRole("button", { name: "Envoyer" }).click();
  await expect
    .poll(async () => {
      let seen = 0;
      for (const page of others)
        seen += await page.getByText("Tu préfères le thé ou le café ?").count();
      return seen;
    })
    .toBe(1);
});
