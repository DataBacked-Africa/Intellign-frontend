import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const file = resolve(dirname(fileURLToPath(import.meta.url)), '../exports/intellign-nysc-deployment.html');
assert.ok(existsSync(file), 'export missing; run npm run export:nysc');
assert.ok(statSync(file).size > 100_000, 'export suspiciously small');
const html = readFileSync(file, 'utf8');

assert.ok(!/<script[^>]+\bsrc=/i.test(html), 'external <script src> found');
assert.ok(!/<link\b/i.test(html), '<link> tag found');
assert.ok(!/@import/i.test(html), '@import found');
assert.ok(!/(src|href)=["']https?:/i.test(html), 'remote src/href found');
assert.equal((html.match(/@font-face/g) ?? []).length, 3, 'expected 3 embedded @font-face blocks');
assert.equal((html.match(/url\(data:font\/woff2;base64,/g) ?? []).length, 3, 'fonts must be embedded as data URIs');
for (const v of ['--font-display', '--font-sans', '--font-mono']) assert.ok(html.includes(v), `${v} not defined`);
for (const family of ['Instrument Serif', 'Inter Tight', 'JetBrains Mono']) assert.ok(html.includes(family), `font family missing: ${family}`);
for (const marker of ['Active problem', 'Recorded run, step by step', 'Why this pairing']) assert.ok(html.includes(marker), `workspace shell marker missing: ${marker}`);
assert.ok(html.includes('Recorded run replay'), 'replay label missing');
assert.ok(html.includes('Confidential'), 'confidential banner missing');
assert.ok(html.includes('not recorded'), 'batch 5 label missing');
assert.ok(html.includes('409 of 500 (81.8%)'), 'headline result missing');
assert.ok(!html.includes('1,000,000') && !/random forest/i.test(html), 'mechanism internals leaked into export');
console.log('verify-nysc-export: ok');
