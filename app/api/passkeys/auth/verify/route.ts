import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyAuthenticationResponse, type AuthenticationResponseJSON } from "@simplewebauthn/server";
import { getDb } from "../../../../../db";
import { passkeys } from "../../../../../db/schema";
import { getAuthDb, setLedgerSession } from "../../../../ledger-auth";
import { consumeChallenge } from "../../../../../lib/auth-store.mjs";

export async function POST(request: Request) {
  const jar = await cookies();
  const grant = await consumeChallenge(getAuthDb(), jar.get("ledger_authentication")?.value, "authenticate");
  jar.delete("ledger_authentication");
  if (!grant) return Response.json({ error: "Face ID sign-in expired. Please try again." }, { status: 400 });
  try {
    const response = await request.json() as AuthenticationResponseJSON;
    if (!response || typeof response.id !== "string") return Response.json({ error: "Invalid passkey response." }, { status: 400 });
    const passkey = await getDb().query.passkeys.findFirst({ where: eq(passkeys.id, response.id) });
    if (!passkey) return Response.json({ error: "That Face ID key is not registered." }, { status: 401 });
    const url = new URL(request.url);
    const verification = await verifyAuthenticationResponse({ response, expectedChallenge: grant.challenge, expectedOrigin: url.origin, expectedRPID: url.hostname, credential: { id: passkey.id, publicKey: Buffer.from(passkey.publicKey, "base64url"), counter: passkey.counter, transports: JSON.parse(passkey.transports) }, requireUserVerification: true });
    if (!verification.verified) return Response.json({ error: "Face ID sign-in could not be verified." }, { status: 401 });
    await getDb().update(passkeys).set({ counter: verification.authenticationInfo.newCounter }).where(eq(passkeys.id, passkey.id));
    const result = Response.json({ verified: true }); await setLedgerSession(result, passkey.id); return result;
  } catch { return Response.json({ error: "Face ID sign-in could not be verified." }, { status: 400 }); }
}
