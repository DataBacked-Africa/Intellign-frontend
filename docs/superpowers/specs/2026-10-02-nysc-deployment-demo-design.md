# NYSC Strategic Deployment Demo: Design

Date: 2026-10-02
Status: draft for review
Audience: grant bodies and government partners (supporting document for an application)

## Purpose

One evidence package showing how the NYSC healthcare-graduate deployment research was carried out and that every assignment is traceable. It ships as:

1. An overview page (`/demo/nysc-deployment`): problem, evolution, results, mechanism, limits.
2. A main replay page (`/demo/nysc-deployment/workspace`): the Intellign workspace replaying the recorded run step by step.
3. A single-file offline HTML export of the replay, for attaching to an application.

## Source of truth

All headline numbers come from `intellign/docs/patent/Intellign_Invention_Disclosure_First_Draft.docx` (sections 5, 7, 12.2, 12.3). Nothing from `paper/experiments/run_log.txt` is used: it is a different, smaller run (8,000 samples, 2 batches, R² 0.536) and would contradict the disclosure.

| Item | Value (disclosure section) |
|---|---|
| Setup | 500 generated graduate records; 750 facilities sampled from 44,915 (GRID3, fixed seed); facility capacity, staffing, specialization and disease fields augmented (12.2) |
| v2 | classifier memorized hand rules (100% accuracy); greedy seeds left 146 overloads and 91 mismatches (5) |
| v3 | regressor on 74,915 moves (59,932 train / 14,983 test), R² 0.7818, RMSE 61.57; best 63,340; first polish 63,340→62,510 reverted; targeted pass → 63,920 kept; skill match 409/500 (81.8%); 423 facilities over capacity (excess 1,915) (12.2) |
| v4 | five batches of 100 with locks; batch bests 16,405 / 15,985 / 14,350 / 13,155; early stops at generations 11–13; filled 94 empty facilities, 67,195→69,850 kept; 66 resources moved out of over-capacity facilities, 2 mismatches fixed, final 65,640; skill match 409/500 (81.8%); 372 facilities over capacity (excess 1,826), all from pre-existing staff, no assigned resource placed in them (12.2) |
| Platform evidence | 2,531 backend tests passed; 91-session replay (12.1) |

Open point in the source: the 12.2 table gives four batch bests for a five-batch run. The replay chart uses only values the disclosure states and marks any unstated batch as "not recorded". Confirm the missing value with the inventors if a complete curve is wanted.

## Honesty rules (hard requirements)

- The replay is labeled "Recorded run replay, not a live solve" on screen at all times.
- The per-assignment table is labeled "Illustrative sample". Rows are produced by a deterministic script over real facility and graduate CSV rows applying the stated objective. It is not output from the recorded run.
- v4 is not presented as improving skill match over v3 (both 409/500). Its claimed gain is structural: locks, staged batches, and zero assigned resources in over-capacity facilities.
- The limits section states: no ablation of the regressor's contribution; v4 regressor evaluation not retained; model repairs during evolution were rare (zero or one per batch at generation 10); graduate records generated and facility fields augmented.
- Every number carries a footnote citing its disclosure section.

## Confidentiality

The disclosure is marked CONFIDENTIAL and unfiled, and section 14 still tracks public disclosures. Per owner direction the mechanism is shown in plain language only: four short sentences (see "Mechanism, plain language"). No equations, objective weights, feature lists, seeding recipe, repair rule, or training parameters appear on the page, in the replay, or in the export. The export carries a visible "Confidential, supporting document" banner. Whether the recipient is under NDA or counsel has cleared release is the owner's decision and is not verified by this work.

## Architecture

```
src/app/demo/nysc-deployment/
  page.tsx                  overview (server component, metadata)
  workspace/page.tsx        client wrapper for <NyscReplay />
  NyscReplay.tsx            replay component: inline styles only, no router/API
  data/nysc-run.json        single data bundle (numbers, steps, sample assignments)
  data/nysc-run.test.ts     asserts bundle numbers equal disclosure values
scripts/export-nysc-demo.mjs   esbuild: component + data -> one HTML
scripts/build-nysc-sample.mjs  deterministic sample-assignment generator
exports/intellign-nysc-deployment.html   build output (git-ignored, NOT under public/, so it is never served)
```

- Design tokens (bone/maroon/ink) copied from `demo/helium-health/shared.tsx`; no Tailwind classes in the replay component so the export needs no CSS build.
- `NyscReplay` takes the JSON bundle as a prop. The page imports the JSON; the export script inlines the same JSON.
- No sitemap entry. Both routes set `robots: noindex, nofollow` via a layout. The routes are unlisted but reachable by URL once deployed; the owner decides whether to deploy them.
- The overview has no download link (the export is not served). The owner generates it with `npm run export:nysc` and attaches the file.
- Batch-best chart shows one bar per batch (batch best only). Per-generation curves are not in the disclosure and are not drawn. The final fitness drop after capacity correction (69,850 to 65,640) is shown as stated; the source does not explain it, and the replay says so.

## Design parity with the Helium demo (hard requirement)

The replay is a port of the `/demo/helium-health` shell, not a custom viewer: same palette tokens (`T`), same `--font-display/--font-sans/--font-mono` (Instrument Serif, Inter Tight, JetBrains Mono), maroon banner, 260 px sidebar, "Active problem" bar with progress chips, avatar chat bubbles with action tags, and the 720 px sliding canvas with Monitor / Results / Assignments / Goals / Config / Datasets tabs, dark chart card and stage timeline. The 8 replay steps map one-to-one onto the Helium run stages (idle, ingest, translate, init, solve, converge, explain, done); each step also selects its canvas tab. The sidebar lists the 8 steps (clickable) instead of Helium's scenarios. The offline export embeds the three self-hosted fonts as data URIs and defines the same CSS variables, so it renders with the product's typography. `#step=N` deep-links to a step without autoplay.

## Replay flow

Chat left, canvas right (Helium layout). Controls: play/pause, previous/next step, restart, speed. Autoplays, fully steppable. Below 1000 px the sidebar hides and the canvas becomes a full-width overlay opened from a Canvas button.

1. Prompt: the NYSC deployment request and the DBA goals (specialization match, disease priority, capacity).
2. Data validated: 500 graduates, 750 of 44,915 facilities, augmented-fields note.
3. Goals compiled: the plain-language goals become a scoring function (shown as goal names only, no formula or weights).
4. Solver routed to the engine; a model is trained to predict how good a single move is (v3 figures R² 0.7818, RMSE 61.57 shown, labeled as v3 since the v4 R² was not retained).
5. Batches 1 to 5 with the lock set growing; fitness curve from stated batch bests.
6. Post-processing: fill 94 empty facilities (kept), correction of 66 resources, final 65,640.
7. Verification: 409/500, 372 over capacity (all pre-existing staff), 0 assigned resources placed in them.
8. Assignment trace: illustrative sample with a rationale per row.

## Overview page sections

Problem and context; evolution timeline v1 to v4 (what each exposed); v3 vs v4 results table; mechanism in plain language; limits; one CTA, "Watch the deployment".

## Mechanism, plain language

Shown identically on the overview and in the replay:

1. The engine searches many possible deployments and keeps improving the best ones.
2. A learned model predicts whether moving one graduate to another facility would make the plan better, so the search wastes less time on bad moves.
3. Placements already decided stay fixed while the rest are solved in batches, so reviewers can pin a person to a site and have the rest adapt.
4. A final check recomputes the real score and keeps a change only if it helps, then removes anyone assigned to an over-capacity facility.

## Error handling and edge cases

- Reduced motion: replay respects `prefers-reduced-motion` (no autoplay).
- Export has no network calls; fonts fall back to system fonts if self-hosted fonts are not inlined.
- Missing data keys fail the build script loudly.

## Verification

- `tsc --noEmit` and `next build` pass.
- `nysc-run.test.ts` fails if any headline number drifts from the table above.
- Browser check of both routes and of the exported HTML opened from `file://`, stepping through all 8 steps.

## Out of scope

- The product walkthrough video (website, login, workspace). Separate spec, see below.
- Re-running v4 or producing real per-assignment output.
- Backend or API changes.

## Video (separate spec, decided: both, with voice)

Two deliverables, specified and built after the NYSC page:

1. Trailer: `/brag --voice`, a 15-25 second launch video for intellign.ai (Hyperframes, Kokoro narration).
2. Full walkthrough: website, login, workspace, results, with voiceover. Scripted browser capture plus TTS and ffmpeg; the NYSC replay can be its closing scene. Needs a demo account or dev bypass, a stable backend or labeled mock, and approval to add Playwright and a TTS package.

Both use the same plain-language mechanism wording above.
