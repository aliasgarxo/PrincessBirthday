// Regenerates gate/lock-page.js from gate/lock.html.
//
// The Workers runtime has no filesystem, so the lock screen cannot be read at
// request time — it ships as a JS module export instead. Edit the HTML, then
// run this to sync:
//
//   node gate/build-lock-page.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "lock.html"), "utf8");

// Escape only the sequences that would terminate or interpolate into a
// template literal.
const escaped = html.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const out = `// Generated from gate/lock.html — the Workers runtime has no filesystem,
// so the lock screen ships as a module export.
// Edit gate/lock.html, then run: node gate/build-lock-page.mjs

export const LOCK_PAGE_HTML = \`${escaped}\`;
`;

writeFileSync(join(here, "lock-page.js"), out);
console.log(`gate/lock-page.js regenerated (${out.length} bytes)`);
