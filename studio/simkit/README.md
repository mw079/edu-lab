# simkit

Small library of interactive science components drawn in SVG. Plain browser scripts on `window.simkit`
(no build, no dependencies) so lessons are single offline HTML files. Usage examples
for the generator are in `snippets/`; `tests/snippets.test.ts` runs each one.

All components take `(stage, opts)` and draw into the stage's SVG coordinate system (default 1000 × 600).
Physical inputs are SI unless stated.

## Core

| API | Purpose |
|---|---|
| `kit.stage(container, { width, height, grid })` | Responsive SVG stage. Has `layer()`, `onFrame(fn)`, `animate(seconds, step) → promise`. Created by the shell; lessons receive it. |
| `kit.el(tag, attrs, parent)`, `kit.set(el, attrs)` | Create/update SVG elements for custom drawings. `attrs.text` sets text. |
| `kit.colors` | Palette: `ink muted line paper red blue green yellow orange purple steel` (+ `redDark`, `blueDark`, `greenDark`). |
| `kit.fmt(n, digits)`, `kit.clamp`, `kit.lerp`, `kit.ticks` | Helpers. |
| `kit.arrow(stage, { x, y, dx, dy, color, label, labelSide })` | Labelled vector → `{ update(opts), show(bool) }`. |
| `kit.physics.collide1D(m1, v1, m2, v2, e)` | Final velocities; `e = 1` elastic, `0` sticky. |
| `kit.physics.circuit(layout, V, [R…])` | `{ totalR, current, parts: [{ R, I, V, P }] }` for `"series"`/`"parallel"`. |
| `kit.physics.gasPressure(n, T, V)` | kPa, with n mol, T kelvin, V litres. |
| `kit.physics.springPeriod(k, m)`, `pendulumPeriod(L, g)` | Seconds. |

## Components

**`kit.plot(stage, { x, y, w, h, title, xLabel, yLabel, xRange, yRange, series: [{ id, color, label, dashed }], autoY })`**
Line plot → `{ set(id, points), add(id, [x, y]), clear(), setRange({ xRange, yRange }) }`.

**`kit.cartTrack(stage, { y, carts: [{ id, mass, v, pos, color, label }], arrows: "momentum"|"velocity"|"none", range: [0, 10] })`**
Two carts on a metre-marked track. `update({ A: { mass, v, pos } })`, `showArrows(bool)`,
`runCollision({ e }) → Promise<{ collided, v: { A, B } }>` (animated), `reset()`, `stop()`.
Mechanics: momentum, collisions, velocity, relative motion.

**`kit.springMass(stage, { x, y, k, mass, displacement, showForce, onSample(t, x) })`**
Wall, spring, block, equilibrium line, cm ruler, restoring-force arrow. `update({ k, mass, displacement })`,
`play({ amplitude, duration }) → promise` (SHM), `period()`, `stop()`. Pair with `kit.plot` via `onSample`.
Hooke's law, SHM, energy.

**`kit.circuit(stage, { x, y, w, h, layout: "series"|"parallel", V, parts: [{ id, type: "resistor"|"bulb", R, label }], showValues })`**
Battery with 1–4 parts, animated charge flow (speed ∝ current per wire), bulb brightness ∝ power.
`update({ V, parts: { id: { R } } })`, `showValues(bool)`, `values() → { totalR, current, parts: { id: { R, I, V, P } } }`.
Ohm's law, series/parallel, power.

**`kit.gasBox(stage, { x, y, w, h, n, T, V, Vmax, Pmax, showGauge, showThermometer, showValues })`**
Cylinder with piston (position ∝ V), moving particles (count ∝ n, speed ∝ √T), thermometer, pressure gauge.
`update({ n, T, V })`, `showValues(bool)`, `pressure()` (kPa). Gas laws, kinetic theory.

## Adding a component

1. New file in `simkit/`, appended to `SIMKIT_FILES` in `server/lesson.ts`.
2. Factory `kit.name = (stage, opts) => api`; draw into `stage.layer()`; animate only via `stage.onFrame`/`stage.animate`.
3. Physics in `kit.physics` when lessons also need it in `model()`.
4. Add a snippet in `snippets/`, an entry in `catalog.json`, and document it here.
