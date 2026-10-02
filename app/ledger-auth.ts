import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { createSession, sessionIsValid, revokeSession, SESSION_TTL_SECONDS } from "../lib/auth-store.mjs";

const SESSION_COOKIE = "our_ledger_session";

export function getAuthDb() {
  if (!env.DB) throw new Error("Database is not configured.");
  return env.DB;
}

export async function hasLedgerAccess() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return sessionIsValid(getAuthDb(), token);
}

export async function setLedgerSession(response: Response, passkeyId: string) {
  const token = await createSession(getAuthDb(), passkeyId);
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`);
}

export async function clearLedgerSession(response: Response) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await revokeSession(getAuthDb(), token);
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}
