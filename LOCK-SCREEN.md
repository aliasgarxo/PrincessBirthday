# Password lock screen

The site is a **Worker with static assets**, gated by `worker/index.js`. The
Worker runs at the edge on **every** request (see `run_worker_first` below) and
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
| `worker/index.js` | The gate. Auth check, `/api/login`, `/api/logout`. |
| `wrangler.jsonc` | Worker + assets config. **`run_worker_first: true` is load-bearing.** |
| `.assetsignore` | Keeps source and `.git` out of the uploaded asset bundle. |
| `gate/lock.html` | Lock screen source — **edit this one**. |
| `gate/lock-page.js` | Generated from the above; the Workers runtime has no filesystem. |
| `gate/build-lock-page.mjs` | Regenerates `lock-page.js`. |
| `gate/hash-password.mjs` | Generates `PASSWORD_HASH` and `SESSION_SECRET`. |

To restyle the lock screen, edit `gate/lock.html`, then:

```bash
node gate/build-lock-page.mjs
```

## Setup

Deploys here are **manual** — this project is not wired to build on push, so a
`git push` changes nothing on the live site. Every step below is run by you
from a machine logged into Cloudflare.

### 1. Log in

```bash
npx wrangler login
```

### 2. Generate the credentials

```bash
node gate/hash-password.mjs 'a passphrase of several words'
```

Minimum 12 characters, enforced. The plaintext is never written to disk — only
the PBKDF2 hash.

### 3. Set them as Worker secrets

```bash
npx wrangler secret put PASSWORD_HASH
npx wrangler secret put SESSION_SECRET
```

Paste each value when prompted. **Do this before deploying.** The gate fails
closed, so a deploy without these makes the site return `503` to everyone.

### 4. (Recommended) Create the KV namespace for rate limiting

Without it the gate still works, but brute-force throttling is silently
skipped.

```bash
npx wrangler kv namespace create GATE_KV
```

Uncomment the `kv_namespaces` block in `wrangler.jsonc` and paste in the id it
prints.

### 5. Deploy

```bash
npx wrangler deploy
```

### 6. Verify

In a private window, confirm `https://alilovesfatema.com/` shows the lock
screen, and that `https://alilovesfatema.com/assets/photos/1.png` also shows
the lock screen rather than the photo. Then log in once and check the gallery
renders.

## How the asset bypass is prevented

`wrangler.jsonc` sets:

```jsonc
"assets": { "run_worker_first": true }
```

This is the single most important line in the config. By default a Worker with
static assets serves a matching asset **before** the Worker runs — which would
leave every photo reachable by direct URL with the gate never consulted.
`run_worker_first` forces the Worker to run first on every request, so it can
require a session before calling `env.ASSETS.fetch()`.

`.assetsignore` must list `.git`. Without it `wrangler` tries to upload the
git packfile as an asset and the deploy fails the 25 MiB per-asset limit.

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
| Asset bypass | `run_worker_first: true` — the Worker runs before the asset server. |
| Source disclosure | `.assetsignore` excludes `worker/`, `gate/` and `.git` from the bundle. |
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
  `npx wrangler dev`.
- `SESSION_TTL_HOURS` (optional, default `12`) controls how long an unlock
  lasts.
