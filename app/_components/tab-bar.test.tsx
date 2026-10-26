import { render, screen } from "@testing-library/react";

import { TabBar } from "./tab-bar";

vi.mock("next/navigation", () => ({ usePathname: () => "/envies" }));

describe("TabBar", () => {
  it("shows the four tabs with icon and label", () => {
    render(<TabBar />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
      ["🏠Accueil", "/"],
      ["💬Messages", "/messages"],
      ["🎁Envies", "/envies"],
      ["💡Idées", "/idees"],
    ]);
    expect(screen.getByRole("link", { name: "Accueil" })).toBeInTheDocument();
  });

  it("marks the current tab", () => {
    render(<TabBar />);
    expect(screen.getByRole("link", { name: /Envies/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Accueil/ })).not.toHaveAttribute("aria-current");
  });

  it("shows a badge count", () => {
    render(<TabBar badges={{ "/messages": 3 }} />);
    expect(screen.getByRole("link", { name: /Messages/ })).toHaveTextContent("3");
  });
});
