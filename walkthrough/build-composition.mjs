// Generates the Hyperframes composition for the walkthrough from narration.json, the clip durations and the recording.
// All timings live in the SCENES table below (video time of raw/walkthrough.webm, which runs ~2% shorter than the wall clock).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const OUT = '../walkthrough-output/composition';
mkdirSync(`${OUT}/assets/fonts`, { recursive: true });
mkdirSync(`${OUT}/assets/audio`, { recursive: true });
mkdirSync(`${OUT}/assets/music`, { recursive: true });
mkdirSync(`${OUT}/assets/sfx`, { recursive: true });

const narr = JSON.parse(readFileSync('narration.json', 'utf8'));
const byId = Object.fromEntries(narr.map((n) => [n.id, n]));
const probe = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

// Cut points come from the capture itself: raw/timeline.json (scene start/end) and raw/marks.json (typing, submit,
// landed, tabs). Both are wall-clock seconds; the recording runs slightly shorter than the wall clock because frames
// drop under load, so every wall time is scaled by K = recording length / wall length before it is used as a cut.
const tlJson = JSON.parse(readFileSync('raw/timeline.json', 'utf8'));
const marks = JSON.parse(readFileSync('raw/marks.json', 'utf8'));
const recLen = probe('raw/walkthrough.webm');
const K = recLen / tlJson[tlJson.length - 1].end;
const W = (x) => +(x * K).toFixed(2);               // wall -> recording time
const sc = Object.fromEntries(tlJson.map((s) => [s.id, s]));
const clampEnd = (x) => Math.min(x, recLen - 0.2);
console.log(`recording ${recLen.toFixed(1)}s, wall ${tlJson[tlJson.length - 1].end.toFixed(1)}s, K=${K.toFixed(4)}`);

// Each scene: source segments [from, to, rate] in recording seconds, plus chapter label.
const SCENES = [
  { id: 's1', chap: '1 · The site',        segs: [[W(sc.s1.start) + 0.1, W(sc.s1.end) - 0.5, 1]] },
  { id: 's2', chap: '2 · Launch',          segs: [[W(sc.s2.start), W(sc.s2.end) - 0.2, 1]] },
  // sign-in: the login page, then typing at 2x (the field is slow to fill), then submit and the redirect at normal speed
  { id: 's3', chap: '3 · Sign in',         segs: [[W(sc.s3.start) + 0.3, W(sc.s3.start) + 2.5, 1], [W(marks.typeStart) - 0.3, W(marks.submit) + 0.2, 4], [W(marks.submit) + 0.2, W(marks.landed) + 0.8, 2]] },
  { id: 's4', chap: '4 · Your workspace',  segs: [[W(marks.landed) + 0.8, W(marks.landed) + 12.4, 1]] },
  { id: 's5', chap: '5 · The live demo',   segs: [[W(sc.s5.start) + 0.2, W(sc.s5.end) - 0.5, 1]] },
  { id: 's6', chap: '6 · Goals and data',  segs: [[W(sc.s6.start) + 0.2, W(sc.s6.end) - 0.8, 1]] },
  { id: 's7', chap: '7 · Run it',          segs: [[W(sc.s7.start) + 0.2, W(sc.s7.end) - 0.6, 1]] },
  // results: a quick pass over the Results tab, then normal speed from just before the Assignments click through the expansion
  { id: 's8', chap: '8 · Results and reasons', segs: [[W(sc.s8.start) + 0.2, W(marks.assignClick) - 4.0, 2], [W(marks.assignClick) - 1.2, clampEnd(W(sc.s8.end) - 0.2), 1]] },
  { id: 's9', chap: '9 · Start here',      segs: [[W(sc.s9.start) + 0.3, clampEnd(W(sc.s9.end)), 1]] },
];
const END_DUR = 3.5;
const NARR_OFFSET = 0.3;

// Lay scenes on the output timeline.
let t = 0;
const clips = []; const scenes = [];
for (const s of SCENES) {
  const start = t;
  let segStart = t;
  for (const [a, b, rate] of s.segs) {
    const d = (b - a) / rate;
    clips.push({ id: `v-${s.id}-${clips.length}`, start: segStart, dur: d, media: a, rate });
    segStart += d;
  }
  const dur = segStart - start;
  const audioDur = probe(`audio/${s.id}.wav`);
  if (audioDur + NARR_OFFSET > dur + 0.01) console.warn(`${s.id}: narration ${audioDur.toFixed(1)}s exceeds scene ${dur.toFixed(1)}s`);
  scenes.push({ ...s, start, dur, audioDur, text: byId[s.id].text });
  t += dur;
}
const endStart = t;
const total = +(t + END_DUR).toFixed(2);

// Captions: split narration into sentences and spread them across the clip by character count.
const sentences = (txt) => txt.match(/[^.!?]+[.!?]+/g)?.map((x) => x.trim()) ?? [txt];
const caps = [];
for (const s of scenes) {
  const parts = sentences(s.text);
  const totalChars = parts.reduce((n, p) => n + p.length, 0);
  let cursor = s.start + NARR_OFFSET;
  parts.forEach((p, i) => {
    const d = s.audioDur * (p.length / totalChars);
    const end = i === parts.length - 1 ? cursor + d + 0.6 : cursor + d;
    caps.push({ id: `cap-${s.id}-${i}`, start: +cursor.toFixed(2), dur: +(end - cursor).toFixed(2), text: p });
    cursor += d;
  });
}

// SRT for platforms that take a captions file.
const ts = (x) => { const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), sec = Math.floor(x % 60), ms = Math.round((x % 1) * 1000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`; };
writeFileSync('../walkthrough-output/walkthrough.srt', caps.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.start + c.dur)}\n${c.text}\n`).join('\n'));

// Assets.
for (const f of ['instrument-serif-normal', 'instrument-serif-italic', 'inter-tight-normal', 'jetbrains-mono-normal']) copyFileSync(`../src/fonts/${f}.woff2`, `${OUT}/assets/fonts/${f}.woff2`);
copyFileSync('../brag-output/composition/assets/gsap.min.js', `${OUT}/assets/gsap.min.js`);
copyFileSync('../brag-output/composition/assets/sfx/impactSoft_heavy_003.ogg', `${OUT}/assets/sfx/impactSoft_heavy_003.ogg`);
for (const s of SCENES) copyFileSync(`audio/${s.id}.wav`, `${OUT}/assets/audio/${s.id}.wav`);
const MUSIC = 'happy-beats-business-moves-vol-1-by-ende-dot-app.mp3';
copyFileSync(`${process.env.HOME}/.claude/skills/brag/assets/music/${MUSIC}`, `${OUT}/assets/music/${MUSIC}`);
if (!existsSync(`${OUT}/assets/rec.mp4`)) throw new Error('assets/rec.mp4 missing: convert raw/walkthrough.webm first');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const f2 = (x) => +x.toFixed(2);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Intellign: walkthrough</title>
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Instrument Serif"; src: url("assets/fonts/instrument-serif-normal.woff2") format("woff2"); font-weight: 400; font-style: normal; }
      @font-face { font-family: "Instrument Serif"; src: url("assets/fonts/instrument-serif-italic.woff2") format("woff2"); font-weight: 400; font-style: italic; }
      @font-face { font-family: "Inter Tight"; src: url("assets/fonts/inter-tight-normal.woff2") format("woff2"); font-weight: 300 700; font-style: normal; }
      @font-face { font-family: "JetBrains Mono"; src: url("assets/fonts/jetbrains-mono-normal.woff2") format("woff2"); font-weight: 100 800; font-style: normal; }
      :root { --bone: #F4EFE7; --maroon: #5C1427; --maroon-deep: #3E0E1A; --ink: #14110F; --n600: #4A4945; --serif: "Instrument Serif", Georgia, serif; --sans: "Inter Tight", system-ui, sans-serif; --mono: "JetBrains Mono", ui-monospace, monospace; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: var(--bone); }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--bone); font-family: var(--sans); }
      video.rec { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; object-fit: cover; }
      .ov { position: absolute; inset: 0; pointer-events: none; }
      .chap { position: absolute; left: 36px; bottom: 222px; background: var(--maroon-deep); color: var(--bone); font-family: var(--mono); font-size: 22px; letter-spacing: 0.06em; padding: 12px 22px; border-radius: 999px; box-shadow: 0 6px 18px rgba(0,0,0,0.28); }
      .cap { position: absolute; left: 0; right: 0; bottom: 52px; display: flex; justify-content: center; }
      .cap span { max-width: 1500px; background: rgba(20,17,15,0.88); color: var(--bone); font-size: 36px; font-weight: 500; line-height: 1.35; text-align: center; padding: 14px 32px; border-radius: 18px; }
      #end-in { position: absolute; inset: 0; background: var(--bone); display: flex; flex-direction: column; align-items: center; justify-content: center; }
      #wm { font-family: var(--serif); font-size: 280px; line-height: 1; letter-spacing: -0.025em; color: var(--maroon-deep); }
      #tag { margin-top: 18px; font-size: 54px; color: var(--n600); }
      #url { margin-top: 44px; font-family: var(--mono); font-size: 32px; letter-spacing: 0.08em; color: var(--maroon); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="${total}">

${clips.map((c) => `      <video id="${c.id}" class="rec" src="assets/rec.mp4" muted playsinline data-start="${f2(c.start)}" data-duration="${f2(c.dur)}" data-media-start="${f2(c.media)}"${c.rate !== 1 ? ` data-playback-rate="${c.rate}"` : ''} data-track-index="0"></video>`).join('\n')}

${scenes.map((s) => `      <section id="chap-${s.id}" class="ov clip" data-start="${f2(s.start)}" data-duration="${f2(s.dur)}" data-track-index="1"><div class="chap" id="chapt-${s.id}">${esc(s.chap)}</div></section>`).join('\n')}

${caps.map((c) => `      <section id="${c.id}" class="ov clip" data-start="${c.start}" data-duration="${c.dur}" data-track-index="2"><div class="cap"><span id="${c.id}-t">${esc(c.text)}</span></div></section>`).join('\n')}

      <section id="end" class="clip" data-start="${f2(endStart)}" data-duration="${END_DUR}" data-track-index="3" style="position:absolute;inset:0">
        <div id="end-in"><div id="wm">Intellign</div><div id="tag">The math layer within AI.</div><div id="url">intellign.ai</div></div>
      </section>

      <audio id="music" src="assets/music/${MUSIC}" data-start="0" data-duration="${total}" data-track-index="10" data-volume="0.3"></audio>
${scenes.map((s) => `      <audio id="vo-${s.id}" data-audio-group="voiceover" src="assets/audio/${s.id}.wav" data-start="${f2(s.start + NARR_OFFSET)}" data-duration="${f2(s.audioDur)}" data-track-index="11" data-volume="1"></audio>`).join('\n')}
      <audio id="wh" src="assets/sfx/impactSoft_heavy_003.ogg" data-start="${f2(endStart + 0.2)}" data-duration="0.55" data-track-index="12" data-volume="0.3"></audio>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      gsap.set(["#end-in"], { opacity: 0 });
      gsap.set("#wm", { opacity: 0, y: 30 });
      gsap.set(["#tag", "#url"], { opacity: 0, y: 18 });
${scenes.map((s) => `      gsap.set("#chapt-${s.id}", { opacity: 0, y: 10 });
      tl.to("#chapt-${s.id}", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, ${f2(s.start + 0.25)});
      tl.to("#chapt-${s.id}", { opacity: 0, duration: 0.3 }, ${f2(s.start + s.dur - 0.5)});`).join('\n')}
${caps.map((c) => `      gsap.set("#${c.id}-t", { opacity: 0 });
      tl.to("#${c.id}-t", { opacity: 1, duration: 0.25 }, ${c.start});
      tl.to("#${c.id}-t", { opacity: 0, duration: 0.25 }, ${f2(c.start + c.dur - 0.25)});`).join('\n')}
      tl.to("#end-in", { opacity: 1, duration: 0.5, ease: "power1.inOut" }, ${f2(endStart)});
      tl.to("#wm", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, ${f2(endStart + 0.2)});
      tl.to("#tag", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, ${f2(endStart + 0.9)});
      tl.to("#url", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, ${f2(endStart + 1.5)});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(`${OUT}/index.html`, html);
console.log(`composition written: ${clips.length} clips, ${caps.length} captions, total ${total}s (end card at ${f2(endStart)}s)`);
