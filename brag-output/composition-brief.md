# Hyperframes Composition Brief: Intellign

## Objective
Create a short, polished launch-style trailer for Intellign (intellign.ai) with calm third-person voiceover.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape, 1920x1080
- Duration: 23.6 seconds

## Source Material
- Project root: the Intellign-frontend repo
- Primary files read: `src/components/Marketing/Hero.tsx`, `ProofStrip.tsx`, `HowItWorks.tsx`, `public/llms.txt`, `src/app/demo/page.tsx` (public demo data), `src/app/globals.css` (tokens, fonts)
- Product name: Intellign
- Tagline / strongest claim: "Stop guessing. Start optimizing." and "The math layer within AI."
- Key UI moment to recreate: the workspace shell (sidebar, "Active problem" bar, chat, tabbed canvas) running the NYSC healthcare deployment: goals, solve monitor, assignments with "Why this pairing".
- Copy that must appear verbatim:
  - Stop guessing. / Start optimizing.
  - Deploy 50 NYSC graduates to 20 health centres.
  - Match medical specialization to facility needs. / Prioritise facilities with critical disease burden. / Respect facility personnel capacity.
  - Data validated / Goals compiled / Solver selected / Solver running / Convergence detected / Rationale generated
  - 50 of 50 assigned
  - Why this pairing
  - The math layer within AI. / intellign.ai

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium product film for a funder or government partner
- Interpretation: few scenes, long holds, one idea per scene, calm narrator, serif type at scale, silence on the last beat.
- Angle: the site's own promise, shown working: say the problem in plain English, see it compiled and solved, get a reason for every assignment.
- Hook: "Stop guessing. Start optimizing." at full scale, narrator asks "Who should serve where?"
- Outro / punchline: wordmark, "The math layer within AI.", intellign.ai, then silence.
- Avoid: generic SaaS language; abstract filler visuals; unrelated redesign; any number from the confidential invention disclosure; real people, emails, internal hostnames.

## Visual Identity
- Background: #F4EFE7 (bone), panels #E8E0D2, dark chart card #14110F
- Text: #14110F (ink), secondary #6F6E66
- Accent: #5C1427 (maroon), deep #3E0E1A, chart tint #D49AAA
- Display font: Instrument Serif (local file, normal + italic)
- Body font: Inter Tight (local); mono labels: JetBrains Mono (local)
- Visual references from the project: the Helium/demo workspace shell, dark fitness-chart card with stage timeline, assignments table with expandable "Why this pairing".

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. The question — 0.0-5.0s — headline, then the prompt types itself in a chat bubble.
2. Goals, checked against data — 5.0-10.5s — workspace appears; three goal cards arrive one by one; Data ready and Goals compiled chips tick.
3. The solve — 10.5-15.5s — Monitor tab: stage timeline ticks, convergence curve draws, counter lands on 50 of 50.
4. Every assignment, explained — 15.5-20.7s — three assignment rows arrive; the first expands to "Why this pairing".
5. End card — 20.7-23.6s — wordmark, tagline, URL; music fades to silence.

## Audio
- Audio role: restrained music bed under a clear narrator, sparse motion-matched accents
- Audio arc: quiet bed, ducked under each narration line, swell into the wordmark, fade to silence
- Music: `assets/music/happy-beats-business-moves-vol-10-by-ende-dot-app.mp3`
- Music treatment: very low under the voice; fade-out through the last 2 seconds
- Music cue guidance: bundled preset (vol-10, 109.96 BPM). Strong cue 20.74s for the wordmark reveal (beat-locked). Beat grid for sequential reveals: goal cards at 5.74, 7.35, 8.73; assignment rows at 15.82, 16.93, 18.01 (every second or third beat so text holds long enough to read).
- Audio-reactive treatment: none (polished restraint; documented, not a failure)
- Audio-coupled moments:
  - Scene 1 typed prompt: soft key ticks
  - Scene 2 goal cards: quiet warm tap per card
  - Scene 3 counter landing on 50 of 50 and "Converged": one soft confirm
  - Scene 4 rows and the expand click: soft taps
  - End card: one low soft hit on the wordmark
- SFX selection guidance: low high-frequency-risk files only (`interface/click_003`, `interface/bong_001`, `ui/click2`, `impact/impactSoft_medium_002`, `impact/impactSoft_heavy_003`), kept well under the narration.
- SFX analysis guidance: `~/.claude/skills/brag/assets/sfx/sfx-analysis.md` read.
- Voiceover: Kokoro (`af_heart`, speed 0.95), five clips `assets/vo-1.wav` to `vo-5.wav`; music carved under the voice group.
- Audio files: copied into `composition/assets/`

## Hyperframes Instructions
Use `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-cli` and `hyperframes-audio`. /brag is its own workflow.

Requirements:
- Show real UI, copy and visuals from the project (the workspace shell and its real copy).
- Keep all text readable; hold each read to the floor (labels about 0.8s, sentences about 0.3s per word).
- Stay within 15-25 seconds (23.6s).
- Include the planned music, SFX and voiceover.
- Run `hyperframes check` before render; pause for the user's look at the preview before the final render.
- Keep creation and rendering local.
