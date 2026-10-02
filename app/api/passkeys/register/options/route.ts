import { count } from "drizzle-orm";
import { cookies } from "next/headers";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../../db";
import { passkeys } from "../../../../../db/schema";
import { getAuthDb } from "../../../../ledger-auth";
import { createChallenge, CHALLENGE_TTL_SECONDS } from "../../../../../lib/auth-store.mjs";

export async function POST(request: Request) {
  const { name, code } = await request.json() as { name?: string; code?: string };
  if (!env.ENROLMENT_CODE || code !== env.ENROLMENT_CODE) return Response.json({ error: "That setup code is not correct." }, { status: 401 });
  if (typeof name !== "string" || !name.trim() || name.trim().length > 30) return Response.json({ error: "Enter a short name." }, { status: 400 });
  const [{ total }] = await getDb().select({ total: count() }).from(passkeys);
  if (total >= 2) return Response.json({ error: "Both Face ID spaces have already been set up." }, { status: 403 });
  const url = new URL(request.url);
  const options = await generateRegistrationOptions({ rpName: "Our Ledger", rpID: url.hostname, userName: name.trim(), attestationType: "none", authenticatorSelection: { residentKey: "required", userVerification: "required" }, supportedAlgorithmIDs: [-7] });
  const grant = await createChallenge(getAuthDb(), "register", options.challenge, name.trim());
  (await cookies()).set("ledger_registration", grant, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: CHALLENGE_TTL_SECONDS });
  return Response.json(options);
}
