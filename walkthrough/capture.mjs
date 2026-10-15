// Scripted capture of the Intellign walkthrough. Records one continuous 1920x1080 video of the REAL app.
// Each scene holds for its narration length plus a pad, so the voiceover and the picture stay in sync.
//
//   node capture.mjs --dry                       quick pass, screenshots only (recon)
//   node capture.mjs --base=http://localhost:3200 --scenes=s1,s2,s5,s6,s7,s8,s9
//
// Credentials come from walkthrough/.env.local (E2E_EMAIL, E2E_PASSWORD). They are never printed.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const argVal = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const BASE = argVal('base', 'http://localhost:3200');
const ONLY = argVal('scenes', '').split(',').filter(Boolean);
const DRY = process.argv.includes('--dry');
const PAD = DRY ? 0 : Number(argVal('pad', '2.5'));

const env = {};
if (existsSync('.env.local')) {
  for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !l.trim().startsWith('#')) env[m[1]] = m[2];
  }
}
const HAS_CREDS = Boolean(env.E2E_EMAIL && env.E2E_PASSWORD);

const scenes = JSON.parse(readFileSync('narration.json', 'utf8'));
const dur = Object.fromEntries(scenes.map((s) => [s.id, existsSync(`audio/${s.id}.wav`)
  ? Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `audio/${s.id}.wav`]).toString().trim())
  : 8]));

mkdirSync('raw', { recursive: true });
mkdirSync('shots', { recursive: true });

// The product is up and answering before we spend a take on it.
try {
  const r = await fetch(BASE, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`status ${r.status}`);
} catch (e) {
  console.error(`Cannot reach ${BASE}: ${e.message}. Start the app first; no recording made.`);
  process.exit(2);
}

const CURSOR = `(() => {
  if (window.__fc) return;
  const el = document.createElement('div'); window.__fc = el;
  el.style.cssText = 'position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;';
  el.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.2 L18 13 Z" fill="#14110F" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  const add = () => document.documentElement.appendChild(el);
  if (document.documentElement) add(); else document.addEventListener('DOMContentLoaded', add);
  window.addEventListener('mousemove', (e) => { el.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
  window.addEventListener('mousedown', (e) => {
    const r = document.createElement('div');
    r.style.cssText = 'position:fixed;left:' + (e.clientX - 22) + 'px;top:' + (e.clientY - 22) + 'px;width:44px;height:44px;border-radius:50%;border:3px solid #5C1427;z-index:2147483646;pointer-events:none;opacity:.9;transition:transform .5s,opacity .5s;';
    document.documentElement.appendChild(r);
    requestAnimationFrame(() => { r.style.transform = 'scale(1.7)'; r.style.opacity = '0'; });
    setTimeout(() => r.remove(), 600);
  }, true);
})();`;

const LABEL = `(() => {
  if (document.getElementById('wt-label')) return;
  const d = document.createElement('div'); d.id = 'wt-label'; d.textContent = 'Live demo \\u00b7 precomputed run';
  d.style.cssText = 'position:fixed;left:700px;top:46px;z-index:2147483645;background:#3E0E1A;color:#F4EFE7;font:600 15px/1 system-ui,sans-serif;letter-spacing:.04em;padding:9px 18px;border-radius:999px;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.25)';
  document.documentElement.appendChild(d);
  // The demo page ships a hard-coded real person in the sidebar footer. Mask it for the recording, and keep masking after re-renders.
  const redact = (root) => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      const v = n.nodeValue;
      if (/adeola/i.test(v)) n.nodeValue = v.replace(/Adeola Adegbemijo/g, 'Demo User').replace(/adeola@\\S*/gi, 'demo@example.com').replace(/Adeola/g, 'Demo');
    }
  };
  redact(document.body);
  if (!window.__wtObs) { window.__wtObs = new MutationObserver(() => redact(document.body)); window.__wtObs.observe(document.body, { childList: true, subtree: true, characterData: true }); }
})();`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  ...(DRY ? {} : { recordVideo: { dir: 'raw/tmp', size: { width: 1920, height: 1080 } } }),
});
await context.addInitScript(CURSOR);
const page = await context.newPage();
const t0 = Date.now();

let mx = 960, my = 540;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const glide = async (x, y, steps = 28) => { await page.mouse.move(x, y, { steps }); mx = x; my = y; };
const park = async () => { await page.mouse.move(mx, my); };
async function clickEl(loc, { name = 'element' } = {}) {
  const el = loc.first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  const b = await el.boundingBox();
  if (!b) throw new Error(`no box for ${name}`);
  await glide(b.x + b.width / 2, b.y + b.height / 2);
  await sleep(250);
  await page.mouse.down(); await sleep(80); await page.mouse.up();
}
async function typeInto(loc, text, delay = 70) {
  await clickEl(loc, { name: 'field' });
  await page.keyboard.type(text, { delay });
}
async function scrollToY(y, ms) {
  await page.evaluate(async ({ y, ms }) => {
    const start = window.scrollY; const t0 = performance.now();
    await new Promise((res) => {
      const step = (t) => {
        const p = Math.min(1, (t - t0) / ms); const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        window.scrollTo(0, start + (y - start) * e);
        if (p < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }, { y, ms });
}
async function scrollToSel(sel, ms, offset = 90) {
  const y = await page.evaluate(({ sel, offset }) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().top + window.scrollY - offset : null; }, { sel, offset });
  if (y !== null) await scrollToY(y, ms);
}
const shot = async (id) => { if (DRY) await page.screenshot({ path: `shots/${id}.png` }); };

const timeline = [];
const marks = {};
const mark = (k) => { marks[k] = (Date.now() - t0) / 1000; };
async function scene(id, fn) {
  if (ONLY.length && !ONLY.includes(id)) return;
  const target = DRY ? 1 : dur[id] + PAD;
  const start = (Date.now() - t0) / 1000;
  const began = Date.now();
  console.log(`scene ${id} target ${target.toFixed(1)}s`);
  await fn();
  await shot(id);
  const rest = target * 1000 - (Date.now() - began);
  if (rest > 0) await sleep(rest); else console.warn(`  ${id} ran long by ${(-rest / 1000).toFixed(1)}s`);
  timeline.push({ id, start, end: (Date.now() - t0) / 1000 });
}

// ---- 1. the site ----
// Load the landing page BEFORE the scene clock starts, so the first seconds of narration are not spent on a blank page.
if (!ONLY.length || ONLY.includes('s1')) { await page.goto(`${BASE}/`, { waitUntil: 'networkidle' }); await park(); await sleep(DRY ? 0 : 800); }
await scene('s1', async () => {
  await sleep(DRY ? 0 : 3000);
  await scrollToSel('#how', DRY ? 200 : 6000);
  await sleep(DRY ? 0 : 3500);
  await scrollToY(0, DRY ? 200 : 2500);
});

// ---- 2. launch ----
await scene('s2', async () => {
  await clickEl(page.getByRole('link', { name: /launch app/i }), { name: 'Launch app' });
  await page.waitForURL(/auth\/login|workspace/, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
});

// ---- 3. sign in ----
await scene('s3', async () => {
  if (!/auth\/login/.test(page.url())) { await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle' }); await park(); }
  await sleep(DRY ? 0 : 1200);
  if (HAS_CREDS) {
    mark('typeStart');
    await typeInto(page.locator('input[type="email"]'), env.E2E_EMAIL);
    await typeInto(page.locator('input[type="password"]'), env.E2E_PASSWORD);
    await clickEl(page.locator('button[type="submit"]'), { name: 'Sign in' });
    mark('submit');
    await page.waitForURL(/workspace/, { timeout: 30000 });
    mark('landed');
  } else {
    console.warn('  no E2E credentials: login page shown, sign-in not performed (scene incomplete)');
  }
});

// ---- 4. workspace ----
await scene('s4', async () => {
  if (!HAS_CREDS) return;
  await page.waitForLoadState('domcontentloaded');
  await sleep(DRY ? 0 : 1200);
  await glide(160, 330); await sleep(DRY ? 0 : 2500);
  await glide(760, 520); await sleep(DRY ? 0 : 2500);
  await glide(1500, 420);
});

// ---- 5. the live demo ----
await scene('s5', async () => {
  await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' }); await park();
  await page.evaluate(LABEL);
  await sleep(DRY ? 0 : 2500);
});

// ---- 6. goals and data ----
await scene('s6', async () => {
  await page.evaluate(LABEL);
  const canvasBtn = page.getByRole('button', { name: /^canvas$/i });
  if (await canvasBtn.count()) await clickEl(canvasBtn, { name: 'Canvas' });
  await sleep(DRY ? 0 : 1800);
  await clickEl(page.getByRole('button', { name: /^Goals/ }), { name: 'Goals tab' });
  await sleep(DRY ? 0 : 6000);
  await clickEl(page.getByRole('button', { name: /^Datasets/ }), { name: 'Datasets tab' });
});

// ---- 7. run ----
await scene('s7', async () => {
  await page.evaluate(LABEL);
  await clickEl(page.getByRole('button', { name: /run optimization/i }), { name: 'Run optimization' });
  await page.getByText(/Converged/i).first().waitFor({ timeout: 40000 });
});

// ---- 8. results and reasons ----
await scene('s8', async () => {
  await page.evaluate(LABEL);
  await clickEl(page.getByRole('button', { name: /^Results/ }), { name: 'Results tab' });
  mark('resultsShown');
  await sleep(DRY ? 0 : 3500);
  await clickEl(page.getByRole('button', { name: /^Assignments/ }), { name: 'Assignments tab' });
  mark('assignClick');
  await sleep(DRY ? 0 : 2500);
  // Scope to the canvas panel (the aside that has the title heading); the chat also contains a markdown table.
  const canvas = page.locator('aside').filter({ has: page.getByRole('heading', { level: 2 }) });
  const firstChevron = canvas.locator('table tbody tr').first().locator('button').first();
  await clickEl(firstChevron, { name: 'first assignment' });
  mark('expanded');
  await sleep(DRY ? 0 : 6000);
});

// ---- 9. start here ----
await scene('s9', async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' }); await park();
  await sleep(DRY ? 0 : 1500);
});

const videoPath = DRY ? null : await page.video().path();
await context.close();
await browser.close();
if (videoPath) copyFileSync(videoPath, 'raw/walkthrough.webm');
writeFileSync('raw/timeline.json', JSON.stringify(timeline, null, 2));
writeFileSync('raw/marks.json', JSON.stringify(marks, null, 2));
console.log(DRY ? 'dry pass done: see shots/' : 'recorded raw/walkthrough.webm; timeline in raw/timeline.json');
