import { cookies } from "next/headers";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getAuthDb } from "../../../../ledger-auth";
import { createChallenge, CHALLENGE_TTL_SECONDS } from "../../../../../lib/auth-store.mjs";

export async function POST(request: Request) {
  const url = new URL(request.url); const options = await generateAuthenticationOptions({ rpID: url.hostname, userVerification: "required", allowCredentials: [] });
  const grant = await createChallenge(getAuthDb(), "authenticate", options.challenge);
  (await cookies()).set("ledger_authentication", grant, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: CHALLENGE_TTL_SECONDS });
  return Response.json(options);
}
