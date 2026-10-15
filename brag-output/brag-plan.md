# Brag Plan: Intellign

## What is this app?
Intellign turns a plain-English problem (who goes where, which route, which roster) into a solved, explained assignment you can defend. The proof case here is deploying NYSC healthcare graduates to primary health facilities.

## The angle
A quiet, premium product film for a funder or government partner. The claim is not "AI magic". It is the site's own line: describe the problem in plain English, get the best assignment, and see exactly why. The video shows the real workspace doing that, in the same three beats a user goes through, with a calm narrator.

## Hook (first 2-3 seconds)
Full-scale serif headline from the site: **Stop guessing. Start optimizing.** (second line in italic maroon, as on the homepage). Narrator opens on a question: "Who should serve where?"

## Key moments (the middle)
- The chat prompt types itself: "Deploy 50 NYSC graduates to 20 health centres."
- Three goal cards arrive one by one: Match specialization to need (Reward), Prioritise disease burden (Reward), Respect facility capacity (Penalty).
- The dark Monitor chart fills while the stage timeline ticks from "Data validated" to "Converged", and a counter lands on 50 / 50 assigned.
- The Assignments table slides in row by row; one row expands to "Why this pairing".

## Outro / punchline
Product wordmark, tagline "The math layer within AI.", then intellign.ai. Narrator says the tagline once; music fades; silence on the last beat.

## User flow worth showing
Entry: type the problem in plain English. Key action: goals compiled and checked against the data, then solved. Result: every assignment with a reason. This is the `/workspace` and `/demo` flow (chat on the left, tabbed canvas on the right), recreated from the existing Helium/demo shell, not a diagram of it.

## Tone
- Preset: polished
- Creative direction: quiet premium product film for a funder or government partner
- Interpretation: few scenes, long holds, one idea per scene, narrator in calm third person, no jokes, no exclamation, serif type at scale, silence at the very end.

## Format: landscape — 1920x1080
## Duration: 23.6 seconds (the closing narration line is 2.5s long, so the end card runs 2.9s instead of 2.0s; scenes 1-4 are unchanged)

## Visual identity (from the project)
- Background: #F4EFE7 (bone); deep panels #E8E0D2; dark chart card #14110F
- Accent: #5C1427 (maroon); deep maroon #3E0E1A; chart bar tint #D49AAA
- Text: #14110F (ink); secondary #6F6E66
- Display font: Instrument Serif (self-hosted in src/fonts/instrument-serif-normal.woff2)
- Body font: Inter Tight (src/fonts/inter-tight-normal.woff2); mono labels: JetBrains Mono (src/fonts/jetbrains-mono-normal.woff2)
- Strongest visual element: the workspace shell (sidebar, chat bubbles, dark chart card, stage timeline, assignments table with "Why this pairing").

## Source rules for this video (public-facing)
- Public site only. Do NOT use any figure from the confidential invention disclosure (no 500/750, no fitness numbers, no R2, no batch values, no weights, no mechanism detail).
- Numbers shown come from the public demo/site: 50 graduates, 20 facilities, "50/50 assigned", "3 turns".
- People shown are fictional: initials and job titles only (for example "A. N., ICU nurse"); facility names generic ("Lagos PHC").
- No emails, internal hostnames, tokens or API URLs on screen.

## Share copy (draft)
Describe the problem in plain English. Intellign finds the best assignment and shows you exactly why. intellign.ai

## Voiceover script (Kokoro, single calm voice; ~2.5 words per second; complements the visuals, does not read the screen)
1. "Who should serve where? Say it in plain English." (Scene 1)
2. "Intellign checks your data, and turns your goals into a model." (Scene 2)
3. "Then it solves. Usually in seconds." (Scene 3)
4. "Every assignment comes with a reason you can defend." (Scene 4, start)
5. "Intellign. The math layer within AI." (end card)

## Audio direction
- Role: restrained music bed under a clear narrator, with sparse motion-matched accents
- Music: bundled `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3`, about 110 BPM, warm and light
- Music treatment: starts at 0.0s very low (about -22 dB under the voice), ducks further during narration, gentle swell into the end card, fades out through the last 2 seconds to silence
- Music cue guidance: preset read (vol-10, 109.96 BPM). Strong cues in the planning window: 20.19s, 20.74s, 22.92s. Target 20.74s for the wordmark reveal. Beat grid windows for sequential reveals: goal cards on 5.74s, 7.35s, 8.73s; assignment rows on 15.82s, 16.93s, 18.01s (every second or third beat so each item holds long enough to read).
- Audio-reactive treatment: none
- SFX posture: sparse, motion-matched, professional (soft key ticks while the prompt types, quiet card taps for the goal cards and table rows, one low soft hit for the wordmark)
- Audio-coupled moments: typed prompt; card-by-card goal reveal; row-by-row assignments; the counter reaching 50 / 50; end-card reveal
- Restraint rule: narrator always intelligible; no riser, no impact stings except one soft logo hit; no SFX stacked on narration words

## Storyboard

### Scene 1 — The question — 5.0s (0.0-5.0s)
Cream background. Headline "Stop guessing." enters (about 0.5s), then "Start optimizing." in italic maroon (hold both at least 1.8s total). The headline eases up and shrinks; below it the chat prompt types: "Deploy 50 NYSC graduates to 20 health centres." (hold the finished sentence about 1.2s). Narrator line 1 starts near 0.8s.
Sequential/interaction: yes. The prompt types out character by character into a chat bubble.
Audio intent: calm, confident opening.
Audio-coupled idea: subtle key ticks while typing.
Music: light bed fading in.
Transition mood: soft crossfade → Scene 2

### Scene 2 — Goals, checked against data — 5.5s (5.0-10.5s)
The workspace shell appears (sidebar, "Active problem" bar reading "50 graduates · 20 facilities · 3 goals"). Three goal cards arrive one by one on the Goals tab, each with a Reward or Penalty badge and one short label: "Match specialization to need", "Prioritise disease burden", "Respect facility capacity". A "Data ready" chip then a "Goals compiled" chip tick on. Narrator line 2.
Sequential/interaction: yes. Cards arrive one by one on beats 5.74s, 7.35s, 8.73s; each holds at least 1.2s after arriving, and the full set holds about 1.5s at the end.
Audio intent: orderly, reassuring.
Audio-coupled idea: a quiet tap per card; chip tick.
Music: bed continues, slightly ducked under the voice.
Transition mood: slide → Scene 3

### Scene 3 — The solve — 5.0s (10.5-15.5s)
Canvas switches to the Monitor tab: dark chart card with bars filling, stage timeline ticking down from "Data validated" to "Converged" (each tick about 0.6s), and the stat card counter counting up to "50 / 50 assigned". Narrator line 3 ("Then it solves. Usually in seconds.").
Sequential/interaction: yes. Timeline ticks one by one; counter counts up and lands on 50 / 50 at about 14.0s, then holds 1.4s.
Audio intent: momentum, then resolution.
Audio-coupled idea: counter ticks softly; one soft confirm tone on "Converged".
Music: bed continues.
Transition mood: clean wipe → Scene 4

### Scene 4 — Every assignment, explained, and end card — 7.2s (15.5-22.7s)
First 5.2s: the Assignments tab. Three rows slide in one by one on 15.82s, 16.93s, 18.01s: initials and specialization, a generic facility ("Lagos PHC"), a green "Matched" badge. The first row expands to show "Why this pairing" with one plain sentence ("ICU specialization matches the facility's need; closest in-state placement."). Narrator line 4 at about 15.7s.
Last 2.0s (20.7-22.7s): everything eases back to bone. Wordmark "Intellign" in Instrument Serif at large scale, the tagline "The math layer within AI." beneath, then "intellign.ai". Wordmark reveal on strong cue 20.74s. Narrator line 5 over the reveal. Music fades out; the final beat is silent.
Sequential/interaction: yes. Rows arrive one by one; the first expands on a simulated click at about 19.0s.
Audio intent: trust, then a clean landing.
Audio-coupled idea: quiet tap per row; click on expand; one low soft hit on the wordmark.
Music: gentle swell into the end card, fade to silence.
Transition mood: soft crossfade to the end card; no hard cut.

**Music mood for this video:** warm, light, restrained
**Audio summary:** a quiet music bed under a calm narrator, soft motion-matched taps as items arrive, one low hit on the wordmark, then a fade to silence.
