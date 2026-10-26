import { render } from "@testing-library/react";

import { LiveRefresh } from "./live-refresh";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

class FakeEventSource {
  static last: FakeEventSource;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;
  close = vi.fn();
  constructor(public url: string) {
    FakeEventSource.last = this;
  }
}

describe("LiveRefresh", () => {
  const reload = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("EventSource", FakeEventSource);
    Object.defineProperty(window, "location", { value: { reload }, writable: true });
    refresh.mockClear();
    reload.mockClear();
  });

  it("refreshes the page on each event", () => {
    render(<LiveRefresh />);
    expect(FakeEventSource.last.url).toBe("/api/events");
    FakeEventSource.last.onmessage?.(new MessageEvent("message", { data: '{"kind":"group"}' }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("reloads after five errors in a row without reconnecting", () => {
    render(<LiveRefresh />);
    const es = FakeEventSource.last;
    for (let i = 0; i < 4; i++) es.onerror?.();
    es.onopen?.();
    for (let i = 0; i < 4; i++) es.onerror?.();
    expect(reload).not.toHaveBeenCalled();
    es.onerror?.();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("LiveRefresh when the browser gives up", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("EventSource", Object.assign(FakeEventSource, { CLOSED: 2 }));
  });
  afterEach(() => vi.useRealTimers());

  it("reconnects itself after a fatal error, and reloads after five failures", () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", { value: { reload }, writable: true });
    render(<LiveRefresh />);
    for (let attempt = 1; attempt <= 4; attempt++) {
      const es = FakeEventSource.last;
      Object.assign(es, { readyState: 2 });
      es.onerror?.();
      vi.advanceTimersByTime(30_000);
      expect(FakeEventSource.last).not.toBe(es);
    }
    expect(reload).not.toHaveBeenCalled();
    Object.assign(FakeEventSource.last, { readyState: 2 });
    FakeEventSource.last.onerror?.();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
