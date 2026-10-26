import { act, renderHook } from "@testing-library/react";

import { useAction } from "./use-action";

describe("useAction", () => {
  it("turns a rejected action (expired session, lost network) into a French message", async () => {
    const { result } = renderHook(() => useAction());
    await act(async () => {
      result.current.run(() => Promise.reject(new TypeError("Failed to fetch")));
    });
    expect(result.current.error).toBe("La connexion a été perdue. Recharge la page et réessaie.");
  });
});
