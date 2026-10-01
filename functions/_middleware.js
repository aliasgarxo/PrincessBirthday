/**
 * Password gate for the birthday site, running as Cloudflare Pages Functions
 * middleware.
 *
 * This middleware is invoked for every request to the project (see
 * _routes.json), so nothing is served until the request carries a valid
 * session cookie — including every file under /assets. A lock screen written
 * in front-end JS could not do this: the photos would stay fetchable by URL.
 *
 * Uses only Web Crypto, which is native to the Workers runtime.
 */

import { LOCK_PAGE_HTML } from "../gate/lock-page.js";

const COOKIE_NAME = "bday_session";
const DEFAULT_TTL_HOURS = 12;
const MAX_FREE_ATTEMPTS = 5;
const MAX_LOCKOUT_SEC = 15 * 60;

/* ------------------------------------------------------------ encoding utils */

const enc = new TextEncoder();

function b64urlFromBytes(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesFromB64(b64) {
  const s = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Accepts ArrayBuffer or ArrayBufferView, returns a Uint8Array view. */
function asBytes(value) {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}

/** Constant-time compare. Workers exposes timingSafeEqual; fall back if absent. */
function constantTimeEqual(a, b) {
  const x = asBytes(a);
  const y = asBytes(b);
  if (x.byteLength !== y.byteLength) return false;
  if (crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(x, y);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/* ---------------------------------------------------------------- password */

/** Stored form: pbkdf2-sha256$<iterations>$<saltB64>$<hashB64> */
function parseHash(stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return null;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1000) return null;
  return { iterations, salt: bytesFromB64(parts[2]), hash: bytesFromB64(parts[3]) };
}

async function verifyPassword(password, stored) {
  const parsed = parseHash(stored);
  if (!parsed) return false;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: parsed.salt, iterations: parsed.iterations, hash: "SHA-256" },
    keyMaterial,
    parsed.hash.length * 8
  );
  return constantTimeEqual(derived, parsed.hash);
}

/* ----------------------------------------------------------------- session */

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sign(secret, message) {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(message));
  return b64urlFromBytes(new Uint8Array(sig));
}

async function issueToken(secret, ttlMs) {
  const exp = Date.now() + ttlMs;
  const nonce = b64urlFromBytes(crypto.getRandomValues(new Uint8Array(16)));
  const body = `${exp}.${nonce}`;
  return `${body}.${await sign(secret, body)}`;
}

async function tokenIsValid(token, secret) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;

  const expected = enc.encode(await sign(secret, `${exp}.${nonce}`));
  const given = enc.encode(sig);
  // Verify the signature before trusting exp, so a forged token cannot
  // shortcut the HMAC check.
  if (!constantTimeEqual(expected, given)) return false;

  const expMs = Number(exp);
  return Number.isFinite(expMs) && expMs > Date.now();
}

function readCookie(request, name) {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const chunk of header.split(";")) {
    const eq = chunk.indexOf("=");
    if (eq === -1) continue;
    if (chunk.slice(0, eq).trim() === name) return chunk.slice(eq + 1).trim();
  }
  return null;
}

function cookieHeader(token, maxAgeSec) {
  return [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${maxAgeSec}`,
  ].join("; ");
}

/* ------------------------------------------------------------ rate limiting */

/**
 * Backed by a KV namespace bound as GATE_KV. Workers isolates are ephemeral
 * and per-colo, so an in-memory counter would not survive or be shared — KV
 * is the portable option. It is eventually consistent (a determined attacker
 * spread across colos gets a little extra headroom), so pair it with a
 * Cloudflare rate-limiting rule on /api/login for a hard ceiling.
 */
function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

async function getLockout(env, ip) {
  if (!env.GATE_KV) return 0;
  const raw = await env.GATE_KV.get(`fail:${ip}`);
  if (!raw) return 0;
  try {
    const rec = JSON.parse(raw);
    return Math.max(0, (rec.lockUntil || 0) - Date.now());
  } catch {
    return 0;
  }
}

async function recordFailure(env, ip) {
  if (!env.GATE_KV) return 0;
  const key = `fail:${ip}`;
  let rec = { fails: 0, lockUntil: 0 };
  const raw = await env.GATE_KV.get(key);
  if (raw) {
    try {
      rec = JSON.parse(raw);
    } catch {
      /* corrupt value — start over */
    }
  }
  rec.fails = (rec.fails || 0) + 1;
  if (rec.fails > MAX_FREE_ATTEMPTS) {
    const over = rec.fails - MAX_FREE_ATTEMPTS;
    const backoffSec = Math.min(2 ** (over - 1) * 5, MAX_LOCKOUT_SEC);
    rec.lockUntil = Date.now() + backoffSec * 1000;
  }
  await env.GATE_KV.put(key, JSON.stringify(rec), { expirationTtl: 3600 });
  return Math.max(0, (rec.lockUntil || 0) - Date.now());
}

async function clearFailures(env, ip) {
  if (env.GATE_KV) await env.GATE_KV.delete(`fail:${ip}`);
}

/* ----------------------------------------------------------------- responses */

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  // Protected content must never sit in a shared cache.
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
};

function json(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      ...extra,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function lockPage(status = 200) {
  return new Response(LOCK_PAGE_HTML, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src https://fonts.gstatic.com; script-src 'unsafe-inline'; " +
        "connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'",
    },
  });
}

/* --------------------------------------------------------------------- gate */

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const route = url.pathname;

  const passwordHash = env.PASSWORD_HASH;
  const sessionSecret = env.SESSION_SECRET;

  // Fail closed. If the gate is misconfigured it must never fall through to
  // the unprotected site.
  if (!passwordHash || !sessionSecret || sessionSecret.length < 32) {
    return json(503, {
      error:
        "Lock screen is not configured. Set PASSWORD_HASH and SESSION_SECRET " +
        "in the Cloudflare Pages project settings.",
    });
  }

  const ttlMs = (Number(env.SESSION_TTL_HOURS) || DEFAULT_TTL_HOURS) * 3600 * 1000;

  /* ---- login ---- */
  if (route === "/api/login") {
    if (request.method !== "POST") return json(405, { error: "method not allowed" });

    const ip = clientIp(request);
    const waitMs = await getLockout(env, ip);
    if (waitMs > 0) {
      return json(429, {
        error: "Too many attempts. Try again shortly.",
        retryAfterSeconds: Math.ceil(waitMs / 1000),
      });
    }

    let password = "";
    try {
      const body = await request.json();
      password = String(body.password ?? "");
    } catch {
      return json(400, { error: "Bad request" });
    }

    const ok = password.length > 0 && (await verifyPassword(password, passwordHash));
    if (!ok) {
      const lockMs = await recordFailure(env, ip);
      return json(401, {
        error: "That's not it. Try again 💗",
        ...(lockMs > 0 ? { retryAfterSeconds: Math.ceil(lockMs / 1000) } : {}),
      });
    }

    await clearFailures(env, ip);
    return json(200, { ok: true }, {
      "Set-Cookie": cookieHeader(await issueToken(sessionSecret, ttlMs), Math.floor(ttlMs / 1000)),
    });
  }

  /* ---- logout ---- */
  if (route === "/api/logout") {
    if (request.method !== "POST") return json(405, { error: "method not allowed" });
    return json(200, { ok: true }, { "Set-Cookie": cookieHeader("", 0) });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(405, { error: "method not allowed" });
  }

  const authed = await tokenIsValid(readCookie(request, COOKIE_NAME), sessionSecret);

  if (route === "/login") {
    if (authed) {
      return new Response(null, { status: 302, headers: { ...SECURITY_HEADERS, Location: "/" } });
    }
    return lockPage(200);
  }

  if (!authed) {
    // The lock page is returned for every gated path, so a request for
    // /assets/photos/1.png reveals nothing about what exists.
    return lockPage(401);
  }

  // Authenticated: let Pages serve the static asset, but strip it from any
  // shared cache on the way out.
  const response = await next();
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
