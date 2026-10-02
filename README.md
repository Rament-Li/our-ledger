# Our Ledger

A shared spending tracker with an expense dashboard, manual entries, a token-protected capture endpoint, and WebAuthn passkey sign-in.

This portfolio copy contains source code and schema migrations, not financial records or a production deployment. Personal names and bank references have been replaced with generic examples. iOS Shortcuts can submit expenses to the capture endpoint; Shortcut exports are not included.

## Features

- Monthly totals and spending categories.
- Add, edit and delete expenses.
- Capture amount, merchant, date/time, category and source through an API.
- Duplicate-safe capture when a client supplies a stable event ID.
- Passkey enrolment for up to two people.
- Server-stored, expiring, single-use passkey challenges and individually revocable sessions.

**Stack:** TypeScript, React, Vinext, Cloudflare D1, Drizzle ORM, WebAuthn, Tailwind and shadcn/ui.

Built with Codex assistance: requirements, privacy goals and review guide the project; Codex generated implementation code. This repository is a prototype, not a security-certified financial service.

## Local Setup

Use Node.js 22.13 or newer.

```bash
npm ci
npm test
npm run lint
npm run build
```

The included `.openai/hosting.json` contains only local binding names. Its database ID is a dummy value in the Vite configuration. It contains no account ID, live database identifier or credential.

Create an ignored `.dev.vars` file using `.dev.vars.example` as a guide. Set a strong random `CAPTURE_TOKEN` and a different strong random `ENROLMENT_CODE`; do not use the example placeholders as real values. Wrangler/Cloudflare tooling loads local bindings and variables. A real deployment needs its own secret configuration and D1 binding.

Apply every migration in `drizzle/` to your local D1 database using your configured Wrangler environment before opening the application. For the generated local preview configuration, after building:

```bash
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_jazzy_quicksilver.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_magenta_doorman.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_auth_state.sql
npm start
```

Passkeys require a secure browser context; use HTTPS for deployed environments. Browser/device passkey support and deployment settings must be tested separately.

## Data and Security

Secrets are supplied through the environment. The database stores expenses, public passkey information, hashed session tokens and temporary challenge state. There is no reason to add card numbers, bank account numbers, balances or full bank notifications to an expense. Free-text merchant/note fields are not a data-loss prevention system: do not submit sensitive text to them.

The capture endpoint sends only selected expense fields to storage, and the UI uses generic bank labels. Capture uses a bearer token and does not grant access to read the dashboard. Session cookies are HttpOnly, Secure and SameSite=Strict; sessions expire after one day and are revoked server-side on logout. Passkey challenges expire after five minutes and are consumed on verification. The two-passkey limit is enforced in the database insert.

This copy changes the authentication storage model. Apply the new migration before use; existing sessions from older versions will need to sign in again. No live service or existing database is changed by this repository cleanup.

Before a public deployment, configure rate limits for the enrolment and authentication endpoints, review hosting/origin controls, and test the complete device sign-in flow. Local tests exercise the auth-state SQL against SQLite; they do not certify a deployed service.

## Repository Hygiene

Never commit `.dev.vars`, `.env` files, database exports, receipt images, private keys, logs, browser sessions or deployment state. `.gitignore` excludes common local formats. Included public image provenance and third-party licence notices are retained.
