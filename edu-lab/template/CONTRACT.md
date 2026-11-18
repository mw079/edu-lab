# Lesson contract

A lesson is one JavaScript file that calls `defineLesson(config)` once. Generated lessons are not
written by hand: `server/design.ts` assembles this file from `design.json` + `scene.js`. The shell is
fixed: the simulation on the left with readouts underneath, one task card on the right (goal, answer box,
the controls the current step needs, Check, hints that end in the worked solution), and a "Key ideas"
formula sheet that opens from the header. After step 5 the lesson opens into free exploration with every
control unlocked.
The lesson supplies the science: state, controls, a pure model, a scene built from `simkit`, and five levels.

The shell has no welcome screen, tour or help text, so the scene and the goal must explain themselves:
label objects on the stage with one or two words and put numbers next to the things they describe.

Plain browser JavaScript only. No imports, no network, no `eval`, no timers outside `simkit`.
`simkit` is available as the global `simkit` and as the `kit` argument of `scene`.

```js
defineLesson({
  title: "…",                    // short
  subtitle: "…",                 // one sentence, shown to the teacher in the lesson list
  audience: "High school",
  objectives: ["…", "…", "…"],   // 2–4 measurable learning objectives

  state: { key: value, … },      // every value a control or level uses; numbers or option strings

  controls: [                    // what students can change (in the task card)
    { key: "m", label: "Mass", unit: "kg", min: 1, max: 6, step: 1 },
    { key: "type", label: "Collision", type: "select",
      options: [{ value: "elastic", label: "Bounce" }, { value: "sticky", label: "Stick" }] },
  ],

  model(s) { return { derivedKey: … }; },   // PURE: state -> derived numbers. No DOM.

  readouts: [{ key: "p", label: "Momentum", unit: "kg·m/s", digits: 1 }],  // keys from state or model; at most 5

  stage: { width: 1000, height: 560 },        // SVG coordinate system for the scene

  scene(stage, kit, app) {                    // build the picture once from simkit components;
                                              // app.link("controlKey") lets a component set a control (drag/click)
    const track = kit.cartTrack(stage, { … });
    return {
      update(s, d, info) { … },               // called after every change; info = { level, hidden:Set, solved }
                                              // level counts from 0 (step 1 = 0, step 5 = 4, exploration = 5)
      reset(s, d, info) { … },                // optional: level start / Reset button
      stop() { … },                           // optional: stop animations
      run(s, d) { return promise; },          // optional: anything actions call
    };
  },

  actions: [{ id: "run", label: "Run collision", run: (view, s, d) => view.run(s, d) }],

  formulas: [{ expr: "p = m × v", meaning: "…" }],   // the "Key ideas" list
  debrief: "One or two sentences shown when the lesson opens into free exploration.",

  levels: [ /* exactly 5, see below */ ],
});
```

## Levels

```js
{
  title: "Momentum of one cart",
  goal: "Give the red cart a momentum of +12 kg·m/s.",   // one concrete, checkable target; include any givens
  setup: { mB: 2, vB: -2 },                              // state at level start (merged over `state`)
  lock: ["mB", "vB", "run"],                             // hidden in this step; locked actions appear once solved
  show: ["pTotal", "vA2"],                               // readouts this step shows (0–3); Explore shows all
  hide: ["vA2"],                                         // of those, shown as "?" until solved
  ask: { label: "Final velocity", unit: "m/s" },         // optional typed numeric answer
  hints: ["…", "…"],                                     // 2–3, each more specific, never the answer; shown one at a time
  check: (s, d, answer) => Math.abs(d.pA - 12) < 1e-9,   // true when solved
  feedback: (s, d, answer) => "…",                       // optional: targeted message for wrong attempts
  solution: { mA: 3, vA: 4 },                            // control values (or { answer: 3 }) that solve it
  solutionText: "…",                                     // worked solution, offered after the last hint
  explain: "…",                                          // shown after solving
}
```

Rules checked automatically:

- Every level starts unsolved; applying `solution` to the start state passes `check`.
- `solution` only changes unlocked controls, within `min`/`max`, on the slider `step`.
- Question levels (`ask`) need `solution.answer`; goal levels need at least one control change.
- `lock`, `show`, `hide` and `setup` refer to existing controls/actions, readouts and state keys.
- Every level has `show` (at most 3 readouts); `hide` keys are also in `show`.
- The stage only labels things: no title, goal, instructions or readout values as stage text.
- Readouts produce finite numbers.
- In the browser: no errors, every level is solved by applying its solution and pressing Check.

## Pedagogy

- Start concrete: level 1 is one small action on the picture, with most controls locked (hidden).
  Unlock one more control or idea per level, so the student is never facing everything at once.
- Five levels with growth and scaffolding: each level adds one idea or step and is only a little harder
  than the previous one (intuition → quantitative → application → reasoning → transfer).
- Goals are concrete and measurable through the simulation. Use controls for "make X happen" goals and
  `ask` for "predict/calculate" goals; hide readouts and lock actions that would give the answer away.
- Hints guide thinking; `feedback` names the likely misconception for common wrong answers.
- Use tolerances for real-valued checks; integer slider steps keep goals reachable.

## Math

Text fields may contain LaTeX between `$…$` (goal, hints, solutionText, explain, debrief, formula
meanings; `formulas[].expr` is LaTeX without `$`). `assembleLesson` renders it with KaTeX into
`{ html }` values, and the lesson file inlines KaTeX's stylesheet and fonts only when math is present.
Titles, labels and feedback stay plain text (feedback contains live numbers).

