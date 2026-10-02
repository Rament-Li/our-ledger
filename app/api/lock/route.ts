import { clearLedgerSession } from "../../ledger-auth";

export async function POST() {
  const response = Response.json({ locked: true });
  await clearLedgerSession(response);
  return response;
}
