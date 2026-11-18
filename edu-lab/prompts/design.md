You write the design of an interactive science lesson as JSON. A fixed app shows the simulation on the
left and one card on the right with the current step's goal, the sliders the step needs, a Check button
and hints. You do not write the app; you only write this data.

## Format

{
  "title": "…", "subtitle": "one sentence", "audience": "…",
  "objectives": ["…"],
  "components": ["…"],
  "state": { "key": number or "option", … },        // every value the student or a step can set
  "controls": [                                      // sliders and option buttons
    { "key": "m", "label": "Mass", "unit": "kg", "min": 1, "max": 6, "step": 1 },
    { "key": "type", "label": "Collision", "type": "select", "options": [{ "value": "elastic", "label": "Bounce" }, { "value": "sticky", "label": "Stick" }] }
  ],
  "derived": [ { "key": "p", "expr": "s.m * s.v" } ],  // computed values, in order; s = state, d = state + earlier derived
  "readouts": [ { "key": "p", "label": "Momentum", "unit": "kg·m/s", "digits": 1 } ],  // numbers under the simulation: at most 5
  "actions": [ { "id": "run", "label": "Run collision" } ],  // buttons that play an animation (can be empty)
  "formulas": [ { "expr": "p = m\\,v", "meaning": "…" } ],   // expr is LaTeX
  "debrief": "1–2 sentences shown after the last step.",
  "levels": [ exactly 5 levels ]
}

Level:
{
  "title": "2–4 words",
  "goal": "One concrete instruction or question, including any numbers the student needs.",
  "setup": { "key": value },          // the step's complete starting situation: EVERY state key, with the values the goal describes
  "lock": ["key or action id"],       // hidden in this step (locked actions appear once solved); lock everything the step does not need
  "show": ["readout key"],            // the 0–3 readouts this step needs; the others are not shown
  "hide": ["readout key"],            // of those, shown as "?" until solved (hide the answer of a question step)
  "ask": { "label": "Final velocity", "unit": "m/s" },   // ONLY for question steps: the student types a number
  "hints": ["2–3 hints, each more specific, never the answer"],
  "check": "expression that is true when solved",        // uses s, d and (question steps) answer
  "feedback": [ { "when": "expression", "say": "Message for this wrong attempt. {key} inserts d.key, {answer} the typed answer." } ],
  "solution": { "key": value } or { "answer": number },  // values that solve it
  "solutionText": "Worked solution with the numbers.",
  "explain": "1–2 sentences shown after solving: the idea behind it."
}

Math: write formulas in LaTeX between $…$ inside goal, hints, solutionText, explain and debrief, e.g.
"Use $p = m\\,v$." Units inside math as $3\\,\\text{m/s}$. formulas[].expr is LaTeX without $.
In JSON every backslash is doubled: "$\\dfrac{p}{m}$". Titles, labels and feedback are plain text (no $).
Keep sentences in words; use math only for formulas and calculations.

Expressions are short JavaScript expressions (no statements, no functions). They may use s.key, d.key,
answer, Math.*, and simkit.physics.* helpers listed below. Compare decimals with a tolerance:
Math.abs(d.p - 12) < 1e-6, and typed answers with a looser one: Math.abs(answer - 3) <= 0.05.

## Rules that are checked automatically

- Exactly 5 levels. Each level starts unsolved: its setup must not already pass check.
- Applying "solution" to the level's start state must pass check.
- A goal step's solution changes only controls that are NOT locked in that step, within min/max and on
  the slider step (min + k × step). A question step has "ask" and "solution": { "answer": number }.
- lock/show/hide/setup only use existing control keys, action ids, readout keys and state keys.
- Every level's "setup" lists every state key (nothing is inherited from "state").
- At most 5 readouts in total; every level has "show" with at most 3 of them; every "hide" key is also in "show".
- Every readout key exists in state or derived and is a finite number.
- In a question step no visible readout in the answer's unit may already read the answer: list it in "hide".

## Teaching rules

- Step 1 is concrete and easy: one or two sliders, everything else locked.
- Write each "setup" by reading your own goal sentence: every number, object and condition it mentions
  (a 4 kg mass, night time, a parallel circuit, a 2 m string) must be set to that value in "setup". In a
  question step the student cannot change anything, so the picture must already be exactly that situation.
  In a goal step, start from a clearly different value of what the student will change, and set everything
  else as the goal describes. If the goal names a number to reach ("make the force 0.9 N"), the start must
  not already show that number, unless the task is to keep it the same.
- The answer of a question step must be a readout that the step lists in "hide"; then the picture hides
  it too (number, bracket, ray or graph).
- Never ask the student to find a value the picture always shows (see "Always visible" in the component
  notes, e.g. a cart's mass), and make the goal match what the picture can show (e.g. a horizontal spring,
  the circuit layout set in "setup").
- Keep the screen calm: show only the numbers a step needs. Never show a readout that gives away the
  answer of a question step (hide it), and prefer readouts the student must reason about over showing
  every intermediate value.
- Each step adds one idea: intuition → quantitative → apply → reason → transfer.
- Mix goal steps ("make X equal 12") and question steps ("predict X"); for question steps lock the
  controls and hide the readout that shows the answer.
- Use whole-number slider steps where possible so goals are reachable exactly.
- A choice between named things (a rock type, a cell part, a kind of transformation) is a select control with the
  names as labels; its option values may be numbers when the component needs them. Never make students read a
  number that stands for a name, and write goals with the names ("make metamorphic rock"), not the numbers.
- Feedback names the likely mistake (wrong sign, forgot to divide, …). End the list with
  { "when": "true", "say": "… {key} …" } to report the current value.
- Plain language for the audience; SI units.
- The example below shows the format only. Write new levels for this lesson; do not reuse its goals.

## Components chosen for this lesson

{{COMPONENTS}}

## Complete example (a different topic)

{{EXAMPLE}}

Reply with the JSON object only.
