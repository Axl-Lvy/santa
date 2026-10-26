import { EventEmitter } from "node:events";

export type LiveKind = "giftee" | "santa" | "group" | "ideas" | "wishlist" | "draw";

const holder = globalThis as unknown as { __santaBus?: EventEmitter };
const emitter = (holder.__santaBus ??= new EventEmitter().setMaxListeners(0));

/** Tells one participant's open pages that something of `kind` changed. */
export function publish(participantId: number, kind: LiveKind): void {
  emitter.emit(String(participantId), kind);
}

/** Listens to one participant's events; returns the unsubscribe function. */
export function subscribe(participantId: number, fn: (kind: LiveKind) => void): () => void {
  emitter.on(String(participantId), fn);
  return () => emitter.off(String(participantId), fn);
}
