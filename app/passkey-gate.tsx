"use client";

import { useState } from "react";
import Image from "next/image";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthenticationOptions = Parameters<typeof startAuthentication>[0]["optionsJSON"];
type RegistrationOptions = Parameters<typeof startRegistration>[0]["optionsJSON"];

export function PasskeyGate() {
  const [enrolling, setEnrolling] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  async function signIn() {
    setWorking(true); setMessage("");
    try {
      const options = await fetch("/api/passkeys/auth/options", { method: "POST" }).then(async (response) => { const body = await response.json() as AuthenticationOptions & { error?: string }; if (!response.ok) throw new Error(body.error); return body; });
      const response = await startAuthentication({ optionsJSON: options });
      const verified = await fetch("/api/passkeys/auth/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(response) }).then(async (result) => { const body = await result.json() as { verified?: boolean; error?: string }; if (!result.ok) throw new Error(body.error); return body; });
      if (verified.verified) window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Face ID sign-in did not complete."); } finally { setWorking(false); }
  }
  async function enrol() {
    setWorking(true); setMessage("");
    try {
      const options = await fetch("/api/passkeys/register/options", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, code }) }).then(async (response) => { const body = await response.json() as RegistrationOptions & { error?: string }; if (!response.ok) throw new Error(body.error); return body; });
      const response = await startRegistration({ optionsJSON: options });
      const verified = await fetch("/api/passkeys/register/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(response) }).then(async (result) => { const body = await result.json() as { verified?: boolean; error?: string }; if (!result.ok) throw new Error(body.error); return body; });
      if (verified.verified) window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Face ID setup did not complete."); } finally { setWorking(false); }
  }
  return <main className="grid min-h-screen place-items-center bg-[#f4eee4] p-5 text-[#17302d]"><section className="w-full max-w-sm rounded-3xl border border-[#ded5c7] bg-white p-7 text-center shadow-sm"><Image className="mx-auto h-24 w-24 rounded-3xl" src="/apple-touch-icon.png?v=2" width={96} height={96} alt="Penguin with cucumber" /><p className="mt-5 text-sm font-medium text-[#6b807a]">Our Ledger</p><h1 className="mt-1 text-2xl font-semibold">{enrolling ? "Set up Face ID" : "Welcome back"}</h1><p className="mt-3 text-sm leading-6 text-[#6b807a]">{enrolling ? "Use the shared setup code once. Your phone will then create its own Face ID passkey." : "Unlock your shared spending ledger with Face ID."}</p>{message && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}{enrolling ? <div className="mt-6 space-y-3 text-left"><Input placeholder="Display name" value={name} onChange={(event) => setName(event.target.value)} /><Input inputMode="numeric" placeholder="Shared setup code" value={code} onChange={(event) => setCode(event.target.value)} /><Button className="w-full rounded-xl bg-[#15616d] hover:bg-[#0f505a]" disabled={working || !name.trim() || !code} onClick={() => void enrol()}><Fingerprint size={18} /> {working ? "Setting up…" : "Set up Face ID"}</Button><button className="w-full text-sm text-[#15616d]" onClick={() => setEnrolling(false)}>I already have Face ID set up</button></div> : <div className="mt-6 space-y-3"><Button className="w-full rounded-xl bg-[#15616d] hover:bg-[#0f505a]" disabled={working} onClick={() => void signIn()}><Fingerprint size={18} /> {working ? "Checking…" : "Continue with Face ID"}</Button><button className="flex w-full items-center justify-center gap-2 text-sm text-[#15616d]" onClick={() => setEnrolling(true)}><LockKeyhole size={15} /> First time here? Set up Face ID</button></div>}</section></main>;
}
