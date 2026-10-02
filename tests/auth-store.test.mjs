import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createChallenge, consumeChallenge, insertPasskey, createSession, sessionIsValid, revokeSession } from '../lib/auth-store.mjs';

function database(t) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const migrations = new URL('../drizzle/', import.meta.url);
  for (const name of readdirSync(migrations).filter(n => n.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(new URL(name, migrations), 'utf8'));
  }
  t.after(() => sqlite.close());
  // Run production SQL against SQLite using the D1 method shape.
  return {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return { bind(...values) {
        return {
          async first() { return statement.get(...values) ?? null; },
          async run() { return { meta: statement.run(...values) }; },
        };
      } };
    },
  };
}

test('forged cookies cannot create an authorised registration challenge', async t => {
  const db = database(t);
  assert.equal(await consumeChallenge(db, 'attacker-controlled', 'register', 1000), null);
  assert.equal(await consumeChallenge(db, undefined, 'register', 1000), null);
});

test('registration state is server-bound, purpose-bound and single-use', async t => {
  const db = database(t);
  const token = await createChallenge(db, 'register', 'server-challenge', 'Example user', 1000);
  assert.equal(await consumeChallenge(db, token, 'authenticate', 1001), null);
  const state = await consumeChallenge(db, token, 'register', 1001);
  assert.equal(state.challenge, 'server-challenge');
  assert.equal(state.label, 'Example user');
  assert.equal(await consumeChallenge(db, token, 'register', 1002), null);
});

test('a challenge expires after five minutes even if a caller keeps its cookie', async t => {
  const db = database(t);
  const token = await createChallenge(db, 'register', 'challenge', 'Example user', 1000);
  assert.equal(await consumeChallenge(db, token, 'register', 301000), null);
});

test('authentication challenges cannot be replayed', async t => {
  const db = database(t);
  const token = await createChallenge(db, 'authenticate', 'challenge', '', 1000);
  assert.ok(await consumeChallenge(db, token, 'authenticate', 1001));
  assert.equal(await consumeChallenge(db, token, 'authenticate', 1002), null);
});

test('the database caps enrolment at two including overlapping requests', async t => {
  const db = database(t);
  const results = await Promise.all([1, 2, 3].map(i => insertPasskey(db, {
    id: `example-${i}`, publicKey: 'example-public-key', counter: 0, transports: [],
  }, 'Example user')));
  assert.equal(results.filter(Boolean).length, 2);
  assert.equal(db.sqlite.prepare('SELECT count(*) AS total FROM passkeys').get().total, 2);
});

test('sessions are distinct, hashed in storage and individually revocable', async t => {
  const db = database(t);
  await insertPasskey(db, { id: 'example-1', publicKey: 'example-public-key', counter: 0, transports: [] }, 'Example user');
  const a = await createSession(db, 'example-1', 1000);
  const b = await createSession(db, 'example-1', 1000);
  assert.notEqual(a, b);
  assert.equal(await sessionIsValid(db, 'forged', 1001), false);
  assert.equal(await sessionIsValid(db, a, 1001), true);
  const stored = db.sqlite.prepare('SELECT token_hash FROM ledger_sessions').all();
  assert.equal(stored.some(row => row.token_hash === a || row.token_hash === b), false);
  await revokeSession(db, a);
  assert.equal(await sessionIsValid(db, a, 1002), false);
  assert.equal(await sessionIsValid(db, b, 1002), true);
});

test('sessions expire server-side after one day', async t => {
  const db = database(t);
  await insertPasskey(db, { id: 'example-1', publicKey: 'example-public-key', counter: 0, transports: [] }, 'Example user');
  const token = await createSession(db, 'example-1', 1000);
  assert.equal(await sessionIsValid(db, token, 86401000), false);
});
