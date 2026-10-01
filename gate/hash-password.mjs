/**
 * Generates the PASSWORD_HASH and SESSION_SECRET for the Pages lock screen.
 *
 *   node gate/hash-password.mjs 'the password you will give her'
 *
 * The plaintext password is never written anywhere — only the PBKDF2 hash,
 * which is what the middleware stores and compares against.
 *
 * PBKDF2-HMAC-SHA256 is used because it is the only password KDF available in
 * the Workers runtime's Web Crypto implementation (no scrypt/argon2 there).
 */

import { pbkdf2Sync, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node gate/hash-password.mjs '<password>'");
  process.exit(1);
}
if (password.length < 12) {
  console.error(
    "Refusing: use at least 12 characters.\n" +
      "The edge CPU budget caps how expensive the KDF can be, so password\n" +
      "length is what carries the security here. A short passphrase of a few\n" +
      "words beats a short complex string."
  );
  process.exit(1);
}

// Tuned for the Cloudflare free plan, which allows 10ms of CPU per request.
// 8k iterations is ~4ms, leaving headroom for the rest of the request. On
// Workers Paid (30s CPU) raise this to 150000 — see LOCK-SCREEN.md.
const ITERATIONS = Number(process.env.PBKDF2_ITERATIONS || 8000);
const salt = randomBytes(16);
const derived = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");

const hash = `pbkdf2-sha256$${ITERATIONS}$${salt.toString("base64")}$${derived.toString("base64")}`;
const sessionSecret = randomBytes(48).toString("base64");

console.log(`
Set these as environment variables in the Cloudflare Pages project
(Settings -> Environment variables). Mark both as "Secret" / encrypted,
and add them to BOTH the Production and Preview environments.

  PASSWORD_HASH
  ${hash}

  SESSION_SECRET
  ${sessionSecret}

Or via wrangler:

  npx wrangler pages secret put PASSWORD_HASH --project-name <your-project>
  npx wrangler pages secret put SESSION_SECRET --project-name <your-project>
`);
