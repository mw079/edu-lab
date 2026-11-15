# Edu Lab

A teacher describes a science lesson (optionally pasting a textbook section); Edu Lab generates a
five-step interactive simulation, checks it automatically and lets the teacher review it. Inspired by
Google's "Harnessing Generative UI for Education: Tailored Learning Interactives" (arXiv 2609.20738).

Status: **M0–M3 done** (component library, lesson template, worked example, automatic checks, generator
with teacher review, visual review and evaluation set). Next: more components and examples (M4).

## How a lesson is generated

The model only fills in small, checked pieces; templates and examples do the rest.

| Step | Model gets | Model writes | Checked by | Teacher |
|---|---|---|---|---|
| 1. Plan | request, audience, pasted source text, one-line catalogue (`simkit/catalog.json`) | title, idea, objectives, 1–2 components | known component ids | edits/approves objectives |
| 2. Steps | plan + chosen components' API + `examples/momentum/design.json` | `design.json`: data, short JS expressions, LaTeX text, 5 levels | `checkDesign` (`server/design.ts`): expressions and LaTeX parse; each level starts unsolved and its solution solves it with unlocked, in-range controls; readout limits | approves or asks for changes |
| 3. Simulation | design summary + chosen components' snippets (`simkit/snippets/`) + example scene | one `scene` function (≈15–40 lines) | every level played and solved in headless Chrome; layout check (`server/layout-check.js`) | opens the lesson |
| 4. Visual review | a screenshot of the simulation at the start of each step + the step goals and hidden values (`prompts/review.md`) | up to 5 problems a student would notice | — (suggestions: one fix round, kept only if the lesson still works, has no more layout problems and a second review finds fewer problems) | — |

Each step gets up to two fix rounds with the check results sent back to the model. `assembleLesson`
turns `design.json` + `scene.js` into `lesson.js`; the model never writes the UI or the level logic.
Drafts live in `data/lessons/<id>/` with every model reply (`llm/`) and screenshots.

- **Source text**: the teacher can paste a textbook section or notes; the plan and design steps base the
  lesson on it (`server/source.ts`, first 12k characters). The app never reads from the web.
- **Math**: text fields hold LaTeX between `$…$`; KaTeX renders it when the lesson is built
  (`server/math.ts`), so lessons need no math library at run time and stay offline.
- **Layout check**: flags overlapping labels, labels on other objects or crossed by another layer's lines
  (e.g. a duplicate ruler), overlapping components, text cut off at the edge, and title, goal or readout
  text drawn on the stage.

## Run

```sh
npm install
npm run build          # teacher app
npm start              # http://127.0.0.1:8787
npm run dev            # server + Vite with hot reload (http://localhost:5173)
```

`.env` (not committed):

```dotenv
FIREWORKS_API_KEY=...
FIREWORKS_MODEL=accounts/fireworks/models/glm-5p3-flash
```

Command line:

```sh
npm run generate -- "Ohm's law with series resistors" --audience "High school"   # whole pipeline, no review
npm run regenerate -- <lesson-id> [--from design|build]   # redo named lessons only; backs up to data/backups/
npm run eval [-- --only id1,id2]   # eval/requests.json through the whole pipeline → data/eval/<run>/summary.md
npm test               # validator, design checks, math, snippets, browser tests
npm run typecheck
```

## Layout

| Path | What |
|---|---|
| `simkit/` | SVG science components (`README.md`), the catalogue the planner picks from (`catalog.json`) and a usage example per component (`snippets/`) |
| `template/` | Fixed student UI (`shell.js`, `shell.css`, `lesson.html`), design tokens shared with the teacher app (`tokens.css`), lesson format (`CONTRACT.md`) |
| `examples/` | Reference lesson(s) as `design.json` + `scene.js`, shown to the generator |
| `prompts/` | Prompts for plan, steps and simulation |
| `server/` | Express API (`index.ts`), pipeline (`pipeline.ts`), design checks and assembly (`design.ts`), lesson build and logic validation (`lesson.ts`), math (`math.ts`), Chrome check (`browser-check.ts`, `layout-check.js`), card pictures (`thumbnail.ts`), Fireworks client (`llm.ts`) |
| `web/` | React teacher app |
| `scripts/` | `generate`, `regenerate`, `eval` |
| `eval/` | Evaluation requests (`requests.json`) |

A lesson is one HTML file: `server/lesson.ts` inlines the shell, simkit, the lesson and (when it has
math) KaTeX's stylesheet and fonts. No AI runs while students use a lesson.

**Student UI.** The simulation on the left (kept at its own proportions), one task card on the right:
goal → controls this step needs → Check → hints ending in a worked solution. At most 3 readouts per step,
a "Key ideas" formula sheet in the header, a clear green "✓ Correct!" box, Check stays available after
solving. The page fits the window. Five steps, then free exploration.

**Teacher app.** Overview of picture cards (the simulation at step 1, `server/thumbnail.ts`, cached in
`data/thumbs/`) with title and audience (Middle school, High school, Undergraduate) and an audience
filter. Lessons open in the same tab with "← All lessons". New lessons go through plan → steps review and
then open. No UI library: plain CSS on shared tokens, because each lesson must stay one offline file.

## Plan

| | Milestone | Status |
|---|---|---|
| M0 | Scaffold, archive old prototypes, `.env` | done |
| M1 | simkit (core, plot, carts, spring, circuit, gas) + template + momentum example + checks | done |
| M2 | Pipeline plan → steps → simulation with check-and-fix rounds; teacher app; redesign; LaTeX; pasted source text | done |
| M3 | Visual review of step screenshots by the vision model (GLM 5.3 Flash accepts images); evaluation on 10 requests | done |
| M4 | More components (toward 50–100 objects) and example lessons beyond physics | in progress: 11 of them so far (added projectile, pendulum, inclined plane, refraction); next chemistry and biology |

### Evaluation (10 requests, `eval/requests.json`)

| Run | Ready | Avg. time | Review findings | Lessons with findings left |
|---|---|---|---|---|
| Before the evaluation fixes | 10/10 | 109 s | 20 | 7 |
| After (circuit layout switch, spring end on the ruler, min. arrow length, "always visible" notes, hidden values also on graphs, start-of-step note for the reviewer) | 10/10 | 125 s | 8 | 3 → after re-review of fixes: Hooke clean |

The reviewer is a language model: findings vary between runs and some are false (e.g. reporting the start
of a step as wrong). It is used for suggestions, never to block a lesson.

**With vs. without the review (paired test, 10 requests).** Each lesson was generated without the review
(A), then the review and its fix round were applied to the same simulation (B), and the final step
pictures were judged blind.

| Outcome | Lessons |
|---|---|
| B clearly better (newton2: wrong values and a shown answer fixed; refraction: light drawn leaving the glass as the step describes) | 2 |
| No visible difference (fix kept but nothing changed at step start) | 1 |
| Unchanged: nothing found (3) or fix rejected by the guard (4) | 7 |
| B worse | 0 |

Findings judged by hand: 11 of 14 real (~80%); all 3 false ones treat a step's starting picture as wrong.
The review costs 7–52 s per lesson (about 30 s on average). It also exposed a bug no code check caught:
an action's animation kept running into the next step and redrew the old values; the shell now stops all
animations when the step changes (`stage.stopAnimations()`).
