# Edu Lab design rules

The rules the fixed parts follow: `template/tokens.css` (shared tokens), the lesson page (`template/shell.*`),
the component library (`simkit/`) and the teacher app (`web/`). The model never reads this file; it writes
scene code with components that already follow it, so every lesson inherits it.

Sources (kept outside this repo): Emil Kowalski's skills (motion, gestures, polish),
impeccable's craft floor and "operate" mode (a working tool, not a showcase), taste-skill's timing values.

## 1. What the page is

A working tool for one student and one task. The simulation is the content; everything else stays quiet.
Motion confirms an action, shows a change of state or keeps continuity. It is never decoration, and there is
exactly one authored moment: solving a step.

## 2. Tokens (`template/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | anything entering, press release, value changes |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | something moving across the screen |
| `--dur-press` | 120 ms | button press |
| `--dur-fast` | 160 ms | hover, colour changes, small reveals |
| `--dur-base` | 220 ms | step content, popovers |
| `--dur-moment` | 360 ms | the "Correct" moment only |

Colours: neutral surfaces, one accent (`--accent`), green only for success, red only for errors. Secondary
text is `--muted` and must keep 4.5:1 on every surface it sits on. Never `transition: all`; list properties.

## 3. Motion

- Never `ease-in` for UI. Exits are faster than entrances. UI motion stays under 300 ms (the moment: 360 ms).
- Nothing appears from `scale(0)`: start at `scale(0.96)` + `opacity: 0`.
- No animation on things done many times in a row or from the keyboard (slider arrow keys, typing).
- Animate `transform` and `opacity` only (the stage tween below redraws SVG and is the exception).
- **Reduced motion** (`prefers-reduced-motion: reduce`): movement goes, opacity and colour stay. Tests,
  screenshots and the visual review run with reduced motion so they capture final states.

### Value changes in the simulation

- **While a pointer is down, the picture follows it 1:1.** Dragging an object and moving a slider never
  ease or lag.
- **When the app changes a value** (step start, Reset, "Set it up for me"), the picture moves from the old to
  the new value in `--dur-base`-ish time (260 ms, ease-out), so the student sees what changed. The state and
  the readouts are final at once; only the drawing travels. Any input cancels the tween.
- Actions ("Run", "Drop") animate physically: real-time physics, or ease-in-out for scripted moves.

### The one moment

Solving a step: the green "Correct" box rises in (360 ms), the step dot turns green with a short scale, and
"Next step" appears. Nothing else in the lesson performs.

## 4. Interaction

- Every pressable thing has hover (only on `(hover: hover) and (pointer: fine)`), `:active` (scale 0.97),
  `:focus-visible` (2 px accent ring) and disabled states.
- Draggable objects on the stage:
  - marked with the dashed purple ring (`kit.grip`), radius ≥ 22 stage units, so the target is ≥ 44 px;
  - cursor `grab`, `grabbing` while dragging; a soft lift (shadow) on hover;
  - `touch-action: none`, pointer tracked on the window so the drag survives redraws and leaving the object;
  - values snap to the control's step; dragging is off while the control is locked.
- The slider stays as the keyboard and small-screen route for every draggable value.

## 5. States

Every view designs: hover, focus, disabled, loading, empty, error.
- Picture cards show a soft placeholder while the picture loads and a plain one if it fails.
- An empty filter says so in one line.
- A failed lesson says what failed.

## 6. Type

- System sans (`--font`), one family. Weights 500 / 600 / 650 / 700 carry hierarchy; sizes step clearly.
- Numbers that change use `tabular-nums`. Minus signs are typographic (`−`).
- Body text max 65 ch. Headings tracked -0.01 to -0.02 em. No eyebrow labels in capitals, no tracked
  uppercase titles (chart titles are sentence case).

## 7. Simulation drawing (simkit)

- Stage: 1000 × 560, warm paper (`kit.colors.paper`) with a faint grid.
- Strokes (what the library uses): 1 = grid, ticks, guides · 2 = outlines, axes, small parts ·
  3–4 = strings, rays, needles, plotted curves · 5 = waves and wires that carry the idea ·
  6 = container walls (steel) and force/velocity arrows. Dashed = guides, hidden or "would be" positions.
- Colour by meaning, not decoration: one colour per physical quantity or object across the lesson; the
  object colour fills shapes. **Text on the stage uses the darker text version of its colour**
  (`kit.textColor`, applied automatically by `kit.el` for `<text>`), so every label keeps ≥ 4.5:1 on paper.
- Labels: one or two words, 16 px semibold (`simkit-label`); ticks 14 px (they shrink with the stage on small screens); never on top of another object.
- Charts: sentence-case title, light gridlines, axis labels with units, series in the object's colour,
  no 3-D, no gradients; a hidden value removes its point/bar, never just its label.

## 8. Teacher app

Same tokens and buttons as the lessons. Picture cards: rounded 14 px, one soft shadow, hover zooms the picture
1.03 inside the card (the card itself stays still). Destructive actions ask first and say what happens.

## 9. Checklist for a change

- [ ] Contrast ≥ 4.5:1 for text (3:1 for large text and UI outlines)
- [ ] Hover, active, focus, disabled, loading, empty, error covered
- [ ] Motion: right easing, under 300 ms, no `transition: all`, reduced-motion path
- [ ] Drag follows the pointer 1:1; slider still works
- [ ] `npm test` passes; screenshots of a lesson and the overview look right
