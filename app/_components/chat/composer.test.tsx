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
