import { renderToString } from "react-dom/server";

import { ScratchCard } from "./scratch-card";

vi.mock("@/lib/actions/reveal", () => ({ markRevealedAction: vi.fn() }));

describe("ScratchCard before JavaScript runs", () => {
  it("hides the name until the scratch layer is painted", () => {
    const html = renderToString(<ScratchCard gifteeName="Léon" />);
    const name = /<div[^>]*>Léon<\/div>/.exec(html)?.[0] ?? "";
    expect(name).toContain('aria-hidden="true"');
    expect(name).toMatch(/visibility:\s*hidden/);
  });
});
