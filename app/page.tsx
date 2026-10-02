import { hasLedgerAccess } from "./ledger-auth";
import { LedgerClient } from "./ledger-client";
import { LedgerForegroundLock } from "./ledger-foreground-lock";
import { PasskeyGate } from "./passkey-gate";

export default async function Home() {
  return (await hasLedgerAccess()) ? <><LedgerForegroundLock /><LedgerClient /></> : <PasskeyGate />;
}
