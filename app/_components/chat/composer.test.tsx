import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChatComposer } from "./composer";

describe("ChatComposer", () => {
  it("keeps a message that failed to send and retries it", async () => {
    const onSend = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "x" })
      .mockResolvedValueOnce({ ok: true, value: undefined });
    render(<ChatComposer placeholder="Écrire…" onSend={onSend} />);
    await userEvent.type(screen.getByPlaceholderText("Écrire…"), "Coucou");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(await screen.findByText("Pas envoyé · Réessayer")).toBeInTheDocument();
    expect(screen.getByText("Coucou")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Réessayer/ }));
    expect(onSend).toHaveBeenNthCalledWith(2, "Coucou");
    await vi.waitFor(() =>
      expect(screen.queryByText("Pas envoyé · Réessayer")).not.toBeInTheDocument(),
    );
  });
});

describe("ChatComposer across a reload", () => {
  beforeEach(() => sessionStorage.clear());

  it("restores a failed message and the half-typed draft after the page reloads", async () => {
    const onSend = vi.fn().mockResolvedValue({ ok: false, error: "x" });
    const first = render(
      <ChatComposer placeholder="Écrire…" storageKey="/messages/famille" onSend={onSend} />,
    );
    await userEvent.type(screen.getByPlaceholderText("Écrire…"), "Premier");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await screen.findByText("Pas envoyé · Réessayer");
    await userEvent.type(screen.getByPlaceholderText("Écrire…"), "Brouillon");
    first.unmount();

    render(<ChatComposer placeholder="Écrire…" storageKey="/messages/famille" onSend={onSend} />);
    expect(screen.getByText("Premier")).toBeInTheDocument();
    expect(screen.getByText("Pas envoyé · Réessayer")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Écrire…")).toHaveValue("Brouillon");
  });

  it("never cuts a long message and shows why the server refused it", async () => {
    const onSend = vi.fn().mockResolvedValue({
      ok: false,
      error: "Ton message est trop long (2000 caractères maximum).",
    });
    render(<ChatComposer placeholder="Écrire…" storageKey="k" onSend={onSend} />);
    const long = "a".repeat(2100);
    await userEvent.click(screen.getByPlaceholderText("Écrire…"));
    await userEvent.paste(long);
    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(onSend).toHaveBeenCalledWith(long);
    expect(
      await screen.findByText("Ton message est trop long (2000 caractères maximum)."),
    ).toBeInTheDocument();
  });
});
