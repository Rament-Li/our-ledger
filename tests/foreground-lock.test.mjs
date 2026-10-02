import test from "node:test";
import assert from "node:assert/strict";
import { shouldLockLedger } from "../lib/foreground-lock.mjs";

test("locks the ledger whenever the app is hidden", () => {
  assert.equal(shouldLockLedger("visibilitychange", "hidden"), true);
});

test("does not lock while the app remains visible", () => {
  assert.equal(shouldLockLedger("visibilitychange", "visible"), false);
});
