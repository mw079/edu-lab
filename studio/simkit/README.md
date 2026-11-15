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
| `kit.physics.projectile(v0, angleDeg, h0, g)` | `{ vx, vy, time, range, maxHeight }`. |
| `kit.physics.incline(m, angleDeg, mu, g)` | `{ weight, normal, parallel, friction, net, a }`; `a = 0` when friction holds the block. |
| `kit.physics.snell(n1, n2, angleDeg)` | `{ theta2, tir, critical }` in degrees. |
| `kit.physics.orbit(a, e, M)` | `{ period (years), rPeri, rAp (AU), vPeri, vAp (km/s) }`. |
| `kit.physics.molarity(moles, volumeML)` | mol/L. |
| `kit.physics.reactionRate(cA, cB, T, EaKJ)` | Relative rate, 1 at cA = cB = 1 and 300 K. |
| `kit.physics.photosynthesis(light, co2, temp)` | `{ rate (bubbles/min), limiting }`. |
| `kit.physics.element(protons, electrons)` | `{ symbol, name, shells }` for elements 1–20. |

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
`update({ n, T, V })`, `show({ P, V, T })`, `showValues(bool)`, `pressure()` (kPa). A hidden value shows "?" and
its instrument stops reading (no needle, no mercury). Gas laws, kinetic theory.

**`kit.projectile(stage, { x, y, w, xMax, v0, angle, h0, g, showPath })`**
Ball launched over marked ground. `update({ v0, angle, h0, g })`, `showPath(bool)`, `launch() → promise`
(trail + landing mark), `reset()`, `stop()`, `values()`. Projectile motion, range, kinematics.

**`kit.pendulum(stage, { x, y, pxPerM, L, angle, mass, g, showValues, onSample(t, angleDeg) })`**
Bob on a string with length and angle labels. `update({ L, angle, mass, g })`, `play({ duration }) → promise`,
`period()`, `stop()`. Period, oscillation, gravity.

**`kit.incline(stage, { x, y, base, angle, mass, mu, g, lengthM, showForces, showValues, showComponents })`**
Block on a ramp with weight, normal and friction arrows (and optionally the along-slope part of the weight).
`update({ angle, mass, mu, g })`, `slide() → promise`, `values()`. Forces, friction, Newton's second law.

**`kit.refraction(stage, { x, y, w, h, n1, n2, angle, label1, label2, showRefracted })`**
Light ray crossing between two materials; total internal reflection above the critical angle.
`update({ n1, n2, angle, label1, label2 })`, `showRefracted(bool)`, `values()`. Snell's law, optics.

**`kit.orbit(stage, { x, y, pxPerAU, a, e, M, showValues, onSample })`**
Planet on an ellipse around a star; faster near the star. `update({ a, e, M })`, `play() → promise`, `values()`.
Kepler's laws, gravity.

**`kit.beaker(stage, { x, y, w, h, volume, vMax, moles, cMax, color, pH, label, showValues })`**
Beaker whose colour and particle density follow the concentration, or the indicator colour of a pH.
`update({ volume, moles, pH, label })`, `concentration()`. Molarity, dilution, acids and bases.

**`kit.reactionBox(stage, { x, y, w, h, nA, nB, T, Ea, labelA, labelB })`**
Moving A and B particles that react to AB while `run()` plays; live counts. `update({ nA, nB, T, Ea })`,
`run({ duration }) → promise`, `reset()`, `products()`. Collision theory, reaction rates (the picture is random).

**`kit.atom(stage, { x, y, protons, neutrons, electrons, showName, showCounts })`**
Shell model for elements 1–20 with name, mass number and charge. `update({ protons, neutrons, electrons })`,
`show({ protons, neutrons, name })` to hide single values.
Atomic structure, ions, isotopes.

**`kit.waterPlant(stage, { x, y, w, h, light, co2, temp, showValues })`**
Pondweed under a lamp; the bubble stream follows the photosynthesis rate. `update({ light, co2, temp })`, `values()`.
Photosynthesis, limiting factors.

**`kit.numberLine(stage, { x, y, w, min, max, step, markers, distance, showValues, showDistance })`**
Number line with up to three markers and a distance bracket. `update({ markers: { id: { value } } })`, `values()`.
Integers, distance, absolute value.

## Adding a component

1. New file in `simkit/`, appended to `SIMKIT_FILES` in `server/lesson.ts`.
2. Factory `kit.name = (stage, opts) => api`; draw into `stage.layer()`; animate only via `stage.onFrame`/`stage.animate`.
3. Physics in `kit.physics` when lessons also need it in `model()`.
4. Add a snippet in `snippets/` (API, physics helper, an "Always visible" note, an example state and scene),
   an entry in `catalog.json`, and document it here. `tests/snippets.test.ts` then runs it automatically.
5. Add a request for it to `eval/requests.json` and run `npm run eval -- --only <id>`.
