import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'src/app/demo/nysc-deployment/data');
const runPath = resolve(dir, 'nysc-run.json');
assert.ok(existsSync(runPath), 'nysc-run.json missing');
const run = JSON.parse(readFileSync(runPath, 'utf8'));

// Numeric values are stored as numbers; also expose them in the comma form shown on screen.
const numbers = [];
JSON.stringify(run, (_k, v) => { if (typeof v === 'number') numbers.push(v.toLocaleString('en-US')); return v; });
const text = JSON.stringify(run) + ' ' + numbers.join(' ');

// Literals that must appear, each copied from the disclosure (section 5, 12.1, 12.2).
const REQUIRED = [
  '500', '750', '44,915', '146', '91',
  '74,915', '59,932', '14,983', '0.7818', '61.57',
  '63,920', '423', '1,915',
  '67,195', '69,850', '65,640', '94', '66',
  '409 of 500 (81.8%)', '372', '1,826', '2,531',
];
for (const lit of REQUIRED) assert.ok(text.includes(lit), `missing disclosure literal: ${lit}`);

// Content that must never appear: mechanism internals, weights, and the other run's numbers.
const FORBIDDEN = [
  /\b(alpha|beta|gamma|delta|epsilon)\b/i,
  /\bweights?\b/i,
  /1,000,000/, /random forest/i, /\b300 trees\b/i, /\b75,000\b/, /roulette/i, /crossover/i,
  /\b42\.5\b/, /\b0\.536\b/,
];
for (const re of FORBIDDEN) assert.ok(!re.test(text), `forbidden content matched: ${re}`);

// Replay structure: eight steps map one-to-one onto the Helium run stages and canvas tabs.
const STAGES = ['idle', 'ingest', 'translate', 'init', 'solve', 'converge', 'explain', 'done'];
const TABS = ['monitor', 'results', 'assignments', 'goals', 'config', 'datasets'];
assert.equal(run.steps.length, 8, 'expected 8 replay steps');
assert.deepEqual(run.steps.map((s) => s.stage), STAGES, 'step stages must follow the run-stage order');
for (const s of run.steps) {
  assert.ok(s.id && s.title && s.assistant && s.durationMs > 0, `step ${s.id} incomplete`);
  assert.ok(TABS.includes(s.tab), `step ${s.id} has unknown tab ${s.tab}`);
  assert.equal(s.stats.length, 3, `step ${s.id} needs exactly 3 monitor stats`);
}
assert.ok(run.steps[0].user, 'step 0 must carry the user prompt');

assert.equal(run.goals.length, 3, 'expected 3 goals');
assert.ok(run.goals.every((g) => g.id && g.description && ['Reward', 'Penalty'].includes(g.award_type) && !('weight' in g)), 'goals need type and must not carry a weight');
assert.equal(run.timeline.length, 6, 'expected 6 timeline entries');

assert.equal(run.batches.length, 5, 'expected 5 batches');
assert.deepEqual(run.batches.slice(0, 4).map((b) => b.value), [16405, 15985, 14350, 13155]);
assert.equal(run.batches[4].value, null, 'batch 5 must be null (not recorded)');
assert.deepEqual(run.cleanup.map((c) => c.value), [67195, 69850, 65640]);
assert.equal(run.compare.rows.find((r) => r.label === 'Skill match').b, '409 of 500 (81.8%)');
assert.equal(run.mechanism.length, 4, 'mechanism must be exactly four plain sentences');
assert.equal(run.results.length, 4, 'expected 4 result cards');

// Sample file, if generated.
const samplePath = resolve(dir, 'sample-assignments.json');
if (existsSync(samplePath)) {
  const sample = JSON.parse(readFileSync(samplePath, 'utf8'));
  assert.equal(sample.length, 40, 'expected 40 sample rows');
  assert.ok(sample.every((r) => r.overCapacity === false), 'sample must have no over-capacity rows');
  assert.equal(new Set(sample.map((r) => r.graduateId)).size, 40, 'duplicate graduate in sample');
  // A mismatch rationale must not claim that no matching facility had room; the scorer can trade a mismatch for higher need.
  assert.ok(sample.every((r) => r.skillMatch || !/no better-matching/.test(r.rationale)), 'mismatch rationale makes an unproven claim');
  assert.ok(sample.every((r) => r.skillMatch || /not on the .* list/.test(r.rationale)), 'mismatch rationale must state the specialization is not accepted');
}

const layoutPath = resolve(root, 'src/app/demo/nysc-deployment/layout.tsx');
assert.ok(existsSync(layoutPath), 'layout.tsx missing');
const layout = readFileSync(layoutPath, 'utf8');
assert.ok(/index:\s*false/.test(layout) && /follow:\s*false/.test(layout), 'layout must set robots index:false, follow:false');
const sitemap = readFileSync(resolve(root, 'src/app/sitemap.ts'), 'utf8');
assert.ok(!/nysc/i.test(sitemap), 'sitemap must not list nysc routes');

console.log('verify-nysc-data: ok');
