import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return pages(path);
    return entry === "page.tsx" ? [path] : [];
  });
}

describe("privacy rule 5: routes are relative to the viewer", () => {
  it("serves exactly the reviewed pages", () => {
    const routes = pages("app")
      .map((p) => relative("app", p).split(sep).slice(0, -1).filter((s) => !/^\(.*\)$/.test(s)))
      .map((segments) => `/${segments.join("/")}`)
      .sort();
    expect(routes).toEqual(
      [
        "/",
        "/decouvrir",
        "/envies",
        "/envies/[participantId]",
        "/idees",
        "/messages",
        "/messages/famille",
        "/messages/mission",
        "/messages/pere-noel",
        "/mission",
        "/organisation",
      ].sort(),
    );
  });
});
