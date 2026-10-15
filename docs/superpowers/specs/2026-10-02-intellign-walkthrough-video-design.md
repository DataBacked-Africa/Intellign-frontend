# Intellign Walkthrough Video: Design

Date: 2026-10-02
Status: draft for review
Audience: funders and government partners; also usable as onboarding ("how users actually get to use Intellign, step by step, without issues").
Companion: the 23.7 s `/brag` trailer in `brag-output/` (already delivered). The trailer is the hook; this is the full tour.

## Decisions (confirmed by the owner)

- Login: a throwaway demo account, shown on the real login screen.
- Workspace run: the labeled demo run (existing `/demo` workspace and its precomputed NYSC data), not a production solve.
- Length and tone: about 3 minutes, calm third-person narration, funders and partners.
- Voice: Kokoro (`af_heart`), same as the trailer. Visual style: polished, same palette and fonts as the product.

## Purpose

Show a first-time user the whole path in one continuous, real-product recording: the marketing site, signing in, arriving in the workspace, running a complete optimization, reading the result, and how to start. Every screen shown is the real running app, not a mock-up.

## Flow and narration (target 3:00, about 420 words at 2.5 words per second)

Each scene has one narration clip. The capture script holds on each scene for the clip's measured length plus a short pad, so picture and voice stay in sync without re-timing.

| # | Scene | On screen (real app) | Narration idea |
|---|---|---|---|
| 1 | The site | Landing hero, scroll to "Four steps from question to assignment" and the proof strip | Say the problem in plain English; Intellign finds the best assignment and shows why |
| 2 | Launch | Click "Launch app" and arrive at sign-in | Where you start |
| 3 | Sign in | Type the demo account's email, then the password (masked by the field), submit | Quick, familiar sign-in |
| 4 | Workspace | Land in `/workspace`: sidebar, chat, canvas | This is where problems live |
| 5 | The live demo | Open "Try the live demo": the NYSC healthcare scenario, with a clear on-screen label "Live demo: precomputed run" | A complete run, start to finish, labeled as the demo |
| 6 | Goals and data | Goals tab, Datasets tab | Goals in plain language, checked against your data |
| 7 | Run | Click "Run optimization"; Monitor stages tick, dark chart, "Converged" | Intellign picks the approach and solves |
| 8 | Results and reasons | Results, then Assignments, expand a row to "Why this pairing" | Every assignment has a reason you can defend |
| 9 | Start | Back to the landing "Launch app" and URL end card | How to begin: intellign.ai |

Scene lengths are set from the generated narration, then summed; if the total exceeds 3:30, trim narration, not pace.

## Honesty and safety rules (hard requirements)

- The demo run is labeled as the live demo's precomputed run on screen at all times in scenes 5 to 8.
- No real personal data on screen. The demo account is a throwaway created for this recording; its email is fictional. No tokens, API URLs, or devtools visible.
- Credentials: the owner creates and verifies the throwaway account (email verification is required by the app) and puts the email and password in `walkthrough/.env.local` (git-ignored). The capture script reads them from the environment. They are never written to the spec, plan, logs, or video metadata, and the assistant does not open that file.
- No figures from the confidential invention disclosure. Numbers come from the public demo (50 graduates, 20 facilities, "50/50 assigned").
- Every on-screen claim and every narrated sentence is grounded in the site's own copy or the demo UI.
- The recording uses a production build of the current code served locally, so no dev overlays appear and the footage matches what ships.

## Approach (chosen)

Scripted capture, then a Hyperframes edit:

1. **Recon** (no recording): walk the flow once with the script's `--dry` mode and screenshots to fix selectors and timings (login uses `input[type=email]` and `input[type=password]`; successful sign-in routes to `/workspace`).
2. **Narration**: generate one Kokoro WAV per scene; measure durations.
3. **Capture**: a Playwright script (1920x1080, `recordVideo`) drives the real app. A small injected cursor and click ripple are drawn in the page so mouse movement is visible in the recording. Each scene ends when its narration length plus pad has elapsed.
4. **Edit**: a Hyperframes composition places the captured scene clips, adds chapter labels (for example "1 · The site"), lower-third captions from the narration text, the music bed (carved under the voice), soft sound accents for clicks, and the end card shared with the trailer.
5. **Deliver**: check, preview for the owner, render, loudness-normalize, poster frame, captions file (`.srt`), share copy.

Rejected: a hand-animated recreation (not the real product, contradicts "real tour"); recording a real production solve (a slow or failed solve means re-recording and the owner chose the labeled demo); screen-recording by hand (not repeatable).

## Risks and mitigations

- **Login needs the real API.** Sign-in calls the live backend. If it is down at recording time the take fails. Mitigation: the script checks reachability first and stops with a clear message instead of recording a broken take.
- **Account state.** The account must be pre-verified; first-run onboarding screens could appear. Mitigation: recon step discovers them; any one-time screens are handled or the account is prepared first.
- **Demo drift.** The `/demo` content is a code-owned fixture and may change. Mitigation: the script asserts expected text (for example "NYSC Healthcare Deployment") before continuing.
- **Timing sync.** Narration lengths drive the holds, so a re-generated clip does not desync the video.
- **Render time.** The trailer (23.6 s) rendered in about 2.7 minutes on this machine; a 3 minute edit may take about 20 minutes. Mitigation: render drafts first.

## Deliverables

```
walkthrough-output/
  walkthrough.mp4        3 minutes, narrated, captioned, poster as frame 0
  walkthrough.jpg        poster
  walkthrough.srt        captions
  walkthrough-plan.md    scene table and final narration script
  share-copy.txt         one-sentence caption
  composition/           the Hyperframes project (editable)
walkthrough/             scratch capture project (git-ignored): script, .env.local, raw recordings
```

## Setup that needs the owner's approval

- Add Playwright as a dev dependency inside the scratch `walkthrough/` project only (plus its Chromium download), not the app's `package.json`.
- Create and verify the throwaway account, and create `walkthrough/.env.local` with `E2E_EMAIL` and `E2E_PASSWORD`.
- Serve a production build from a scratch copy of the source on a spare port, so any dev server and `.next` of the owner are untouched.

## Out of scope

- Settings, sharing, admin, billing and review-approval screens.
- A real production solve.
- Any change to application code.
