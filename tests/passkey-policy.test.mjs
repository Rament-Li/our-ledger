import test from "node:test";
import assert from "node:assert/strict";
import { canEnrollPasskey } from "../lib/passkey-policy.mjs";

test("allows the first two people to enrol a passkey", () => {
  assert.equal(canEnrollPasskey(0), true);
  assert.equal(canEnrollPasskey(1), true);
});

test("closes enrolment after two people", () => {
  assert.equal(canEnrollPasskey(2), false);
});
