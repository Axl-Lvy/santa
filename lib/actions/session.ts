"use server";

import { cookies, headers } from "next/headers";

import { getConfig } from "../config";
import { getDb } from "../db";
import { attemptLogin, pinThrottle } from "../login";
import { deleteSession, SESSION_COOKIE, SESSION_END } from "../session";
import { now } from "../time";
import { attempt, type ActionResult } from "./result";

/** Logs in by first name (and PIN for the admin); sets the session cookie on success. */
export async function loginAction(name: string, pin: string): Promise<ActionResult<"pin" | "in">> {
  const h = await headers();
  return attempt(async () => {
    const config = getConfig();
    const outcome = attemptLogin(
      getDb(),
      {
        name,
        pin,
        ip: h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
        userAgent: h.get("user-agent"),
        country: h.get("cf-ipcountry"),
      },
      { adminName: config.adminName, adminPin: config.adminPin, throttle: pinThrottle, at: now() },
    );
    if (outcome.kind === "pin") return "pin";
    (await cookies()).set(SESSION_COOKIE, outcome.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: h.get("x-forwarded-proto") === "https",
      path: "/",
      expires: SESSION_END,
    });
    return "in";
  });
}

/** Ends this browser's session. */
export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(getDb(), token);
  jar.delete(SESSION_COOKIE);
}
