import { cookies } from "next/headers";
import { verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import { getAuthDb, setLedgerSession } from "../../../../ledger-auth";
import { consumeChallenge, insertPasskey } from "../../../../../lib/auth-store.mjs";

export async function POST(request: Request) {
  const jar = await cookies();
  const grant = await consumeChallenge(getAuthDb(), jar.get("ledger_registration")?.value, "register");
  jar.delete("ledger_registration");
  if (!grant) return Response.json({ error: "Face ID setup expired. Start again with your setup code." }, { status: 400 });
  try {
    const url = new URL(request.url); const response = await request.json() as RegistrationResponseJSON;
    const verification = await verifyRegistrationResponse({ response, expectedChallenge: grant.challenge, expectedOrigin: url.origin, expectedRPID: url.hostname, requireUserVerification: true });
    if (!verification.verified || !verification.registrationInfo) return Response.json({ error: "Face ID setup could not be verified." }, { status: 400 });
    const { credential } = verification.registrationInfo;
    const inserted = await insertPasskey(getAuthDb(), { ...credential, publicKey: Buffer.from(credential.publicKey).toString("base64url") }, grant.label);
    if (!inserted) return Response.json({ error: "Both Face ID spaces have already been set up." }, { status: 403 });
    const result = Response.json({ verified: true }); await setLedgerSession(result, credential.id);
    return result;
  } catch { return Response.json({ error: "Face ID setup could not be verified." }, { status: 400 }); }
}
