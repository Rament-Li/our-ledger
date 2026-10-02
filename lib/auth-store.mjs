import { createHash, randomBytes } from 'node:crypto';

export const CHALLENGE_TTL_SECONDS = 300;
export const SESSION_TTL_SECONDS = 86400;
const hashToken = token => createHash('sha256').update(token).digest('hex');
const newToken = () => randomBytes(32).toString('base64url');

export async function createChallenge(db, purpose, challenge, label = '', now = Date.now()) {
  const token = newToken();
  await db.prepare('DELETE FROM auth_challenges WHERE expires_at <= ?').bind(now).run();
  await db.prepare('INSERT INTO auth_challenges (token_hash, purpose, challenge, label, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(hashToken(token), purpose, challenge, label, now + CHALLENGE_TTL_SECONDS * 1000).run();
  return token;
}

export async function consumeChallenge(db, token, purpose, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 256 || !token) return null;
  // An atomic delete prevents two verification requests from reusing one grant.
  return db.prepare('DELETE FROM auth_challenges WHERE token_hash = ? AND purpose = ? AND expires_at > ? RETURNING challenge, label')
    .bind(hashToken(token), purpose, now).first();
}

export async function insertPasskey(db, credential, label) {
  // Enforce the cap at insertion, not only when generating browser options.
  return db.prepare('INSERT INTO passkeys (id, label, public_key, counter, transports) SELECT ?, ?, ?, ?, ? WHERE (SELECT count(*) FROM passkeys) < 2 RETURNING id')
    .bind(credential.id, label, credential.publicKey, credential.counter, JSON.stringify(credential.transports ?? [])).first();
}

export async function createSession(db, passkeyId, now = Date.now()) {
  const token = newToken();
  await db.prepare('DELETE FROM ledger_sessions WHERE expires_at <= ?').bind(now).run();
  await db.prepare('INSERT INTO ledger_sessions (token_hash, passkey_id, expires_at) VALUES (?, ?, ?)')
    .bind(hashToken(token), passkeyId, now + SESSION_TTL_SECONDS * 1000).run();
  return token;
}

export async function sessionIsValid(db, token, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 256 || !token) return false;
  return Boolean(await db.prepare('SELECT token_hash FROM ledger_sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(hashToken(token), now).first());
}

export async function revokeSession(db, token) {
  if (typeof token !== 'string' || token.length > 256 || !token) return;
  await db.prepare('DELETE FROM ledger_sessions WHERE token_hash = ?').bind(hashToken(token)).run();
}
