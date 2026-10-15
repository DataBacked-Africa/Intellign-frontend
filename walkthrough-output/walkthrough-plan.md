# Walkthrough plan: Intellign, from the website to a result

Spec: `docs/superpowers/specs/2026-10-02-intellign-walkthrough-video-design.md`
Length: about 2 minutes 10 seconds, 1920x1080, calm narration (Kokoro `af_heart`), captions burned in, music carved under the voice.

## What is real and what is labeled

- Everything on screen is the real running app (a production build of the current code).
- Sign-in uses a throwaway account on an isolated local backend (separate Postgres and Redis, never the production API or any existing database). The account email is fictional.
- The run in scenes 5 to 8 is the live demo's precomputed NYSC healthcare scenario, labeled on screen as "Live demo · precomputed run".
- The demo page ships a hard-coded real person in its sidebar footer; the recording masks it live ("Demo User").
- No figure from the confidential invention disclosure is used. Numbers shown are the public demo's own (50 graduates, 20 facilities).

## Scenes and narration

| # | Scene | On screen | Narration |
|---|---|---|---|
| 1 | The site | Landing hero, scroll to "Four steps from question to assignment" | This is Intellign. Describe the problem in plain English, and Intellign works out the best schedule, route, or assignment for your team. Then it shows you exactly why, so the result is one you can trust and defend. It works in four steps: describe, ingest, solve, and explain. |
| 2 | Launch | Click "Launch app" | To begin, choose Launch app. You will be asked to sign in first. |
| 3 | Sign in | Email and password typed (sped up), submit | Sign in with your email and password. If you are new, you can create an account from the same screen, and verify your email once. |
| 4 | Your workspace | "Hi Demo, Where should we start?" | This is the workspace. Your conversations are on the left, the chat is in the centre, and the canvas on the right shows goals, data, progress, and results. |
| 5 | The live demo | NYSC Healthcare Deployment demo | To see a complete run, open the live demo. This one deploys healthcare graduates to primary health facilities across Nigeria. It is a precomputed run, shown so you can follow every step. |
| 6 | Goals and data | Goals tab, Datasets tab | You start by describing the goal in plain language. Intellign turns it into goals you can edit: match specialization to facility needs, prioritise critical disease burden, and respect facility capacity. The Datasets tab shows the data it checked them against. |
| 7 | Run it | Run optimization, Monitor stages | Choose Run optimization. Intellign picks the right solver for the problem and works through the stages: validating data, compiling goals, solving, and converging. This usually takes seconds. |
| 8 | Results and reasons | Results, Assignments, expanded "Why this pairing" | When it converges, the results show what was assigned. Open the assignments to see every pairing. Each one comes with a reason you can read: here, the closest ICU-trained nurse, in the same state. You can approve, modify, or reject any pairing. |
| 9 | Start here | Back to the landing page, then the end card | That is the whole path. Describe the problem, check the goals, run it, and review the reasons. Start at intellign.ai. |

## How it was made

1. Narration: one Kokoro clip per scene.
2. Capture: a Playwright script (Chrome, 1920x1080) drives the app, with a visible cursor and click ripple, and logs the exact time of key events (typing, submit, landed, tab clicks).
3. Edit: `walkthrough/build-composition.mjs` builds a Hyperframes composition from those measured times. Sign-in typing plays at 4x; the results scene is cut so each narrated sentence lands on its matching screen.
4. Audio: music bed carved under the voice, faded in and out, loudness-normalized.
5. Captions: burned in, plus `walkthrough.srt`.
