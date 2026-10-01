# Password lock screen

The site is gated by a Cloudflare Pages Functions middleware
(`functions/_middleware.js`). It runs at the edge on **every** request and
refuses to serve anything — `index.html`, `styles.css`, `script.js`, and every
file under `assets/` — until the request carries a valid session cookie.

> **The gate fails closed.** Until you complete step 2 below, the site returns
> `503` for everyone. Do not merge this to the production branch before the
> secrets are set.

## Why it is done this way

A lock screen written in front-end JavaScript would not have protected
anything:

- the password (or its hash) ships inside the page, readable via view-source
- the photos stay fetchable at `assets/photos/1.png` regardless of the overlay

Because the check happens in the Worker before any asset is served, neither
bypass exists. An unauthenticated request for a photo gets the lock page, not
the image bytes.

## Files

| Path | Purpose |
| --- | --- |
| `functions/_middleware.js` | The gate. Auth check, `/api/login`, `/api/logout`. |
| `_routes.json` | Forces the middleware to run on every path, including `/assets/*`. |
| `gate/lock.html` | Lock screen source — **edit this one**. |
| `gate/lock-page.js` | Generated from the above; the Workers runtime has no filesystem. |
| `gate/build-lock-page.mjs` | Regenerates `lock-page.js`. |
| `gate/hash-password.mjs` | Generates `PASSWORD_HASH` and `SESSION_SECRET`. |

To restyle the lock screen, edit `gate/lock.html`, then:

```bash
node gate/build-lock-page.mjs
```

## Setup

### 1. Generate the credentials

```bash
node gate/hash-password.mjs 'a passphrase of several words'
```

Minimum 12 characters, enforced. The plaintext is never written to disk — only
the PBKDF2 hash.

### 2. Set them in the Pages project

Cloudflare dashboard → your Pages project → **Settings → Environment
variables**. Add both as **encrypted / Secret**, to **both the Production and
Preview environments**:

- `PASSWORD_HASH`
- `SESSION_SECRET`

Or via wrangler:

```bash
npx wrangler pages secret put PASSWORD_HASH   --project-name <project>
npx wrangler pages secret put SESSION_SECRET  --project-name <project>
```

### 3. (Recommended) Bind a KV namespace for rate limiting

Without it the gate still works, but brute-force throttling is skipped.

```bash
npx wrangler kv namespace create GATE_KV
```

Then bind it in **Settings → Functions → KV namespace bindings** with the
variable name `GATE_KV`.

Workers isolates are ephemeral and per-colo, so an in-memory counter would
neither persist nor be shared — KV is the portable option. It is eventually
consistent, so also add a Cloudflare rate-limiting rule on `/api/login` if you
want a hard ceiling.

### 4. Deploy

Pages redeploys on push. Confirm the lock appears, log in once, then check that
a photo URL such as `/assets/photos/1.png` returns the lock page in a private
window.

## Security properties

| Concern | How it is handled |
| --- | --- |
| Password at rest | PBKDF2-HMAC-SHA256, 16-byte random salt. Plaintext never stored. |
| Comparison | `crypto.subtle.timingSafeEqual`, with a constant-time fallback. |
| Session | HMAC-SHA256 over `exp.nonce`; signature verified *before* `exp` is trusted. |
| Cookie | `HttpOnly`, `Secure`, `SameSite=Strict`, 12h expiry. Unreadable from JS. |
| Brute force | 5 free attempts per IP, then exponential backoff to a 15-minute cap (needs `GATE_KV`). |
| CDN leakage | `Cache-Control: private, no-store` on every protected response. |
| Misconfiguration | Fails closed — missing secrets return `503`, never the site. |
| Enumeration | Every gated path returns the same lock page, revealing nothing about what exists. |
| Dependencies | Zero. Web Crypto only. |

## KDF cost and your Cloudflare plan

PBKDF2 iterations are capped by the Workers CPU budget, not by taste:

| Plan | CPU per request | Safe iterations |
| --- | --- | --- |
| Free | 10 ms | **8,000** (~4 ms) ← current default |
| Workers Paid | 30 s | 150,000 (~69 ms) |

The project is on the **free plan**, so the default is 8,000. Exceeding the
CPU limit does not merely slow logins down — the request is killed, and the
gate stops working entirely.

Because the KDF is deliberately cheap, **password length is what carries the
security here.** Use a passphrase of several words.

If you later move to Workers Paid, regenerate with a higher cost and update
the secret:

```bash
PBKDF2_ITERATIONS=150000 node gate/hash-password.mjs 'your passphrase'
```

The iteration count is stored inside `PASSWORD_HASH`, so the middleware picks
it up with no code change.

## Operational notes

- **Changing the password**: regenerate the hash, update `PASSWORD_HASH`,
  redeploy.
- **Rotating `SESSION_SECRET`** invalidates every active session immediately.
- **Local testing**: put the two values in `.dev.vars` (gitignored), then
  `npx wrangler pages dev . --kv GATE_KV`.
- `SESSION_TTL_HOURS` (optional, default `12`) controls how long an unlock
  lasts.
