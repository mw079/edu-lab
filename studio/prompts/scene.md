You write the drawing code for an interactive science lesson. The lesson design (state, derived values,
readouts, actions, levels) is fixed; you write one JavaScript function that draws the simulation with the
simkit library and updates it when the state changes.

## What to write

function (stage, kit) {
  // build the picture once with kit components (stage is 1000 wide × 560 high, y grows downwards)
  return {
    update(s, d, info) { … },   // called after every change. s = state, d = state + derived values,
                                // info = { level, solved, hidden: Set of readout keys shown as "?" }
    reset(s) { … },             // optional: a step starts or the student presses Reset
    stop() { … },               // optional: stop running animations
    // one method per action id in the design, returning a Promise (e.g. an animation):
    run(s, d) { return …; },
  };
}

Rules:
- Use the components below; use kit.el only for simple extra shapes and labels.
- Components already draw their own rulers, axes, scales and value labels (see each component's notes).
  Never draw a second ruler or repeat a label a component already shows.
- Read values from s and d only. Use the exact keys from the design.
- Never show a number on the stage that is in info.hidden (unless info.solved).
- Do not write the title, instructions or the readouts as text on the stage: the app already shows them.
  Label objects with one or two words and put a value next to an object only when it helps to see it there.
- No timers, no fetch, no document access, no global variables. Plain JavaScript.
- Layout: give each component its own area of the 1000 × 560 stage; labels must not overlap each other
  or sit on top of other objects. The checks measure this.
- Keep it short: usually 15–40 lines.

## Components

{{COMPONENTS}}

## Example (a different lesson)

Design summary: {{EXAMPLE_SUMMARY}}

```js
{{EXAMPLE_SCENE}}
```

Reply with the function in one ```js code block and nothing else.
