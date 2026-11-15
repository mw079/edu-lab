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
| `kit.drag(stage, el, link, move)`, `kit.click(el, link, fn)`, `kit.linked(link)`, `kit.grip(parent, x, y, r)` | Direct interaction (see below). |
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
| `kit.physics.lens(f, dObj)` | `{ dImg, m, real, upright }`; negative `f` = diverging, negative `dImg` = virtual. |
| `kit.physics.lever(m1, d1, m2, d2)` | `{ torque1, torque2, net, balanced }` in N·m. |
| `kit.physics.buoyancy(rhoObj, rhoFluid, volumeL)` | `{ weight, buoyant, floats, submerged }`. |
| `kit.physics.coulomb(q1, q2, r)` | `{ force (N), attract }` with charges in µC. |
| `kit.physics.photoelectric(wavelengthNm, workEV)` | `{ photonEV, emitted, keEV, stopV, thresholdNm }`. |
| `kit.physics.punnett(p1, p2, letter)` | `{ cells, AA, Aa, aa, dominant }`; a parent is 0–2 dominant alleles or `"Aa"`. |
| `kit.physics.moonPhase(angleDeg)` | `{ name, lit, day }`; 0 = new moon, 180 = full moon. |
| `kit.physics.motion(x0, v0, a, t)` | `{ x, v }` for constant acceleration. |
| `kit.physics.atwood(m1, m2)` | `{ a, tension, heavier }`. |
| `kit.physics.mixTemp(m1, c1, T1, m2, c2, T2)` | `{ final, heat }`; g, J/(g·°C), °C. |
| `kit.physics.fringeSpacing(wavelengthNm, dMm, Lm)` | Millimetres between bright fringes. |
| `kit.physics.decay(n0, t, halfLife)` | `{ fraction, remaining }`. |
| `kit.physics.stateOf(T, melt, boil)` | `"solid"`, `"liquid"` or `"gas"`. |
| `kit.physics.balance(reaction, coefficients)` | `{ left, right, balanced }` atom counts; reactions in `kit.physics.reactions`. |
| `kit.physics.selection(startDark, bark, generations)` | Fraction of dark moths after selection. |
| `kit.physics.harmonic(n, L, v)` | `{ wavelength, frequency }` of a standing wave. |
| `kit.physics.energyAt(m, h0, h)` | `{ pe, ke, total, v }` for a frictionless fall from rest at `h0`. |
| `kit.physics.titration(cAcid, vAcid, cBase, vBase)` | `{ pH, equivalence }`, strong acid with strong base. |
| `kit.physics.trophic(base, efficiencyPct, level)` | Energy at a feeding level. |
| `kit.physics.osmosis(inside, outside)` | `{ water, solution, size }`. |
| `kit.physics.daylight(month, latitude, tilt)` | `{ daylight, noonSun, season }`. |
| `kit.physics.quadratic(a, b, c)` | `{ vertex, roots, discriminant }`. |
| `kit.physics.stats(values)` | `{ mean, median, min, max, range }`. |
| `kit.physics.bits(value, count)` | Bits of a whole number, highest place first. |
| `kit.physics.gate(type, a, b)` | 0 or 1 for AND, OR, XOR, NAND, NOR, NOT. |
| `kit.physics.bubbleSort(values, steps)` | `{ array, comparisons, swaps, done, next, total }` after `steps` comparisons. |
| `kit.physics.binarySearch(values, target, steps)` | `{ low, high, mid, found, checks, needed }`. |
| `kit.physics.cloudTemperature(cloudPct, isDay)` | °C near the ground. |
| `kit.physics.windSpeed(high, low, distanceKm)` | km/h from a pressure difference. |
| `kit.physics.greenhouse(co2, albedo)` | Earth's average temperature in °C. |
| `kit.physics.correlation(points)` | `{ slope, intercept, r }`. |

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

**`kit.lens(stage, { x, y, pxPerCm, f, dObj, hObj, showImage })`**
Thin lens (converging or diverging) with object, image and two principal rays. `update({ f, dObj, hObj })`,
`showImage(bool)`, `values()`. Lenses, image formation, magnification.

**`kit.wave(stage, { x, y, w, pxPerM, amplitude, wavelength, frequency, showValues })`**
Travelling wave over a metre ruler with wavelength and amplitude marked. `update({ amplitude, wavelength, frequency })`,
`show({ wavelength, amplitude })`, `values() → { speed, period }`. Waves, v = fλ.

**`kit.lever(stage, { x, y, pxPerM, m1, d1, m2, d2, showValues })`**
Beam on a pivot with a load on each side; tips toward the larger turning effect. `update({ m1, d1, m2, d2 })`,
`show({ m1, m2 })`, `values()`. Torque, balance, simple machines.

**`kit.buoyancy(stage, { x, y, w, h, density, fluidDensity, volume, fluidLabel, showForces, showValues })`**
Block that floats partly submerged or sinks, with weight and buoyant-force arrows.
`update({ density, fluidDensity, volume })`, `show({ density, forces })`, `values()`. Density, Archimedes' principle.

**`kit.charges(stage, { x, y, pxPerM, q1, q2, r, showValues })`**
Two point charges with the force on each. `update({ q1, q2, r })`, `show({ q1, q2, r, force })`, `values()`.
Coulomb's law.

**`kit.photoelectric(stage, { x, y, w, h, wavelength, intensity, work, metal, showValues })`**
Light on a metal plate in a vacuum tube; electrons leave below the threshold wavelength.
`update({ wavelength, intensity, work, metal })`, `values()`. Photons, work function.

**`kit.punnett(stage, { x, y, size, parent1, parent2, letter, dominantColor, recessiveColor, showOffspring })`**
Punnett square for one gene with flower-colour offspring. `update({ parent1, parent2 })`, `showOffspring(bool)`,
`values()`. Inheritance, dominant and recessive alleles.

**`kit.moonPhases(stage, { x, y, R, angle, showName, showView })`**
Moon on its orbit with sunlight from the right, and its appearance from Earth. `update({ angle })`,
`show({ name, view })`, `values()`. Moon phases.

**`kit.fractionBars(stage, { x, y, w, barHeight, gap, bars: [{ id, n, d, color, label }], showValues })`**
One to three equal bars cut into parts. `update({ bars: { id: { n, d } } })`, `show({ id: bool })`, `values()`.
Fractions, equivalence, comparison.

**`kit.rightTriangle(stage, { x, y, pxPerUnit, a, b, unit, showValues })`**
Right triangle with labelled legs, hypotenuse and angle. `update({ a, b })`, `show({ a, b, c, angle })`, `values()`.
Pythagorean theorem, trigonometry.

**`kit.motionTrack(stage, { x, y, w, xMax, x0, v0, a, showValues, onSample(t, x, v) })`**
Car on a marked road with constant acceleration. `update({ x0, v0, a })`, `show({ v, t })`, `play({ duration }) → promise`,
`reset()`, `values(t)`. Kinematics, motion graphs (pair with `kit.plot`).

**`kit.atwood(stage, { x, y, pxPerM, m1, m2, showValues })`**
Two masses over a pulley beside a height ruler. `update({ m1, m2 })`, `show({ m1, m2 })`, `play() → promise`, `values()`.
Newton's second law, tension.

**`kit.calorimeter(stage, { x, y, w, h, mWater, tWater, mBlock, cBlock, tBlock, metal, showValues })`**
Metal block dropped into water with a thermometer. `update({...})`, `show({ thermometer })`, `drop() → promise`,
`values()`. Specific heat, thermal equilibrium.

**`kit.doubleSlit(stage, { x, y, w, h, wavelength, d, L, showValues })`**
Two slits and the fringe pattern on a screen with a mm scale. `update({ wavelength, d, L })`, `show({ spacing })`,
`values()`. Interference. Uses `kit.lightColor(nm)`.

**`kit.decayGrid(stage, { x, y, size, count, halfLife, t, unit, showValues })`**
Grid of nuclei that decay with time. `update({ t, halfLife })`, `values()`. Half-life, exponential decay.

**`kit.particleStates(stage, { x, y, w, h, T, melt, boil, substance, showValues })`**
Particles as solid, liquid or gas depending on temperature. `update({ T, melt, boil, substance })`,
`show({ state, T })`, `values()`. States of matter, particle model.

**`kit.equationBalance(stage, { x, y, w, reaction, coefficients, showCounts })`**
Chemical equation with coefficients, molecules and atom counts per side. `update({ coefficients, reaction })`,
`showCounts(bool)`, `values()`. Balancing equations, conservation of mass.

**`kit.naturalSelection(stage, { x, y, w, h, bark, startDark, generations, count, showValues })`**
Dark and light moths on bark of adjustable darkness over generations. `update({ bark, startDark, generations })`,
`values()`. Natural selection, camouflage.

**`kit.coordinatePlane(stage, { x, y, size, range, m, b, showLine, showEquation, showSlope, points })`**
Grid with the line y = mx + b, slope triangle, equation and points. `update({ m, b, points })`,
`show({ line, equation, slope })`, `values()`. Linear functions.

**`kit.circleFigure(stage, { x, y, pxPerUnit, r, angle, unit, showValues })`**
Circle with radius, optional sector, circumference and area. `update({ r, angle })`,
`show({ r, angle, circumference, area })`, `values()`. Circles, π, sectors.

**`kit.energyTrack(stage, { x, y, w, h, hMax, h0, mass, at, showValues })`**
Ball in a frictionless valley with PE, KE and total bars. `update({ h0, mass, at })`, `show({ speed, bars })`,
`play({ swings }) → promise`, `values()`. Conservation of energy.

**`kit.standingWave(stage, { x, y, w, L, n, speed, showValues })`**
String vibrating in harmonic `n` with nodes and half-wavelength marked. `update({ n, L, speed })`,
`show({ wavelength })`, `values()`. Standing waves, harmonics.

**`kit.titration(stage, { x, y, cAcid, vAcid, cBase, vBase, showValues })`**
Burette over a flask with indicator. `update({ cAcid, vAcid, cBase, vBase })`, `show({ pH })`, `values()`.
Neutralisation, equivalence point (pair with `kit.plot` for the curve).

**`kit.energyPyramid(stage, { x, y, w, h, levels, base, efficiency, unit, showValues })`**
Feeding levels with their energy. `update({ base, efficiency })`, `hideEnergy(level)`, `values()`. Energy flow.

**`kit.osmosisCell(stage, { x, y, w, h, inside, outside, showValues, showArrows })`**
Cell that swells or shrinks in a solution, with water arrows. `update({ inside, outside })`,
`show({ arrows, values })`, `values()`. Osmosis.

**`kit.seasons(stage, { x, y, a, b, month, latitude, tilt, showValues })`**
Tilted Earth on its orbit with season and day length. `update({ month, latitude, tilt })`,
`show({ season, daylight })`, `values()`. Seasons, Earth's tilt.

**`kit.parabola(stage, { x, y, size, range, a, b, c, showVertex, showRoots, showEquation })`**
Grid with y = ax² + bx + c, vertex and roots. `update({ a, b, c })`, `show({ vertex, roots, equation })`, `values()`.
Quadratic functions. Shares its grid with `kit.coordinatePlane`.

**`kit.dotPlot(stage, { x, y, w, min, max, values, showMean, showMedian })`**
Numbers as stacked dots with mean and median. `update({ values })`, `show({ mean, median })`, `values()`. Statistics.

**`kit.protractor(stage, { x, y, r, angle, showValue, showType, showScale })`**
Angle between two rays on a protractor. `update({ angle })`, `show({ value, type, scale })`, `values()`. Angles.

**`kit.spinner(stage, { x, y, r, groups: [{ id, label, color, count }], showValues })`**
Wheel of equal slices with a tally. `update({ groups })`, `spin({ times }) → promise`, `reset()`, `values()`.
Probability (results are random).

**`kit.binaryBits(stage, { x, y, bits, value, showValue, showPlaces })`**
Row of bits with place values and the decimal number. `update({ value })` or `update({ bits: [...] })`,
`show({ value, places })`, `values()`. Binary numbers.

**`kit.logicGate(stage, { x, y, type, a, b, showOutput, showTable })`**
One gate with inputs, output lamp and truth table. `update({ type, a, b })`, `show({ output, table })`, `values()`.
Boolean logic.

**`kit.sortBars(stage, { x, y, w, h, values, steps, showValues })`**
Bars part-way through a bubble sort. `update({ steps, values })`, `values()`. Sorting algorithms.

**`kit.binarySearch(stage, { x, y, values, target, steps, showValues })`**
Sorted row searched by halving. `update({ target, steps, values })`, `values()`. Searching algorithms.

**`kit.cloudSky(stage, { x, y, w, h, cloud, day, showValues })`**
Sky with cloud cover by day or night and a thermometer. `update({ cloud, day })`, `show({ temperature })`, `values()`.
Weather, energy from the Sun.

**`kit.windMap(stage, { x, y, w, high, low, distance, showValues })`**
High and low pressure with drifting wind arrows. `update({ high, low, distance })`, `show({ speed })`, `values()`.
Wind, air pressure. (Same file as `cloudSky`: `weather.js`.)

**`kit.greenhouse(stage, { x, y, w, h, co2, albedo, showValues })`**
Sunlight in, heat out, heat turned back by CO₂. `update({ co2, albedo })`, `show({ temperature })`, `values()`.
Greenhouse effect, climate.

**`kit.barChart(stage, { x, y, w, h, bars: [{ id, label, value, color }], max, yLabel, showValues })`**,
**`kit.pieChart(stage, { x, y, r, slices: [...], showValues })`**,
**`kit.scatterPlot(stage, { x, y, w, h, xRange, yRange, xLabel, yLabel, points, extra, showLine, showR })`**
Data charts (`charts.js`). `update({ bars | slices | extra })`, `show({...})`, `values()`. Data visualization.

## Direct interaction

A scene receives `app` as its third argument. `app.link("controlKey")` returns a setter for that control; a
component that is given one lets the student drag or click the object, and calls the setter with the new value.
The lesson page snaps the value to the control's range and step, keeps the slider in step, and disables the
link in steps where the control is locked (so question steps cannot be solved by dragging).

| Component | Option | What the student does |
|---|---|---|
| `pendulum` | `drag: { angle }` | drags the bob |
| `numberLine` | `drag: { [markerId] }` | drags a marker |
| `lever` | `drag: { d1, d2 }` | slides a load along the beam |
| `lens` | `drag: { dObj }` | drags the object along the axis |
| `scatterPlot` | `drag: { x, y }` | drags the red point |
| `binaryBits` | `click: { bits: [...] }` or `{ value }` | clicks a bit to flip it |
| `springMass` | `drag: { displacement }` | pulls or pushes the block |
| `cartTrack` | `drag: { A, B }` (velocity keys) | drags the tip of a cart's arrow |
| `projectile` | `drag: { angle, v0 }` | aims and stretches the launch arrow |
| `rightTriangle` | `drag: { a, b }` | drags the top and right-hand corners |
| `fractionBars` | `click: { [barId] }` (numerator key) | clicks parts to shade them |
| `logicGate` | `click: { a, b }` | clicks an input switch to flip it |
| `barChart` | `drag: { [barId] }` | drags a bar's top |
| `charges` | `drag: { r }` | drags either charge sideways |
| `coordinatePlane` | `drag: { b, m }` | drags the y-intercept and a point on the line |
| `protractor` | `drag: { angle }` | turns the red ray by its end |

In a component: `kit.drag(stage, element, link, (point) => link(valueAt(point)))` (the point is in stage
coordinates), `kit.click(element, link, fn)`, and `kit.grip(...)` to draw the dashed ring that marks a grabbable
object while `kit.linked(link)` is true. Every linked value keeps its slider, for keyboards and small screens.
`kit.drag` and `kit.click` also mark the element (`simkit-draggable`, `simkit-clickable`) so it lifts on hover,
and the stage gets `simkit-dragging` while a drag runs (grabbing cursor). The object follows the pointer 1:1;
give grips a radius of at least 22 so the target is about 44 px (see `DESIGN.md` §4).

## Look (`DESIGN.md` §7)

- Strokes: 1 grid/ticks/guides · 2 outlines/axes · 3–4 strings, rays, curves · 5 waves/wires · 6 container walls and arrows. Dashed = guides.
- Colours from `kit.colors`, one per object or quantity. `<text>` filled with an object colour is drawn in its
  darker text version automatically (`kit.textColor`), so labels stay readable (≥ 4.5:1) on the paper.
- Chart titles are sentence case. A hidden value removes its point or bar, not only its label.
- Value changes made by the lesson page (step start, Reset, "Set it up for me") are animated by the page,
  which calls `update` with in-between values; components need nothing for this.

## Adding a component

1. New file in `simkit/`, appended to `SIMKIT_FILES` in `server/lesson.ts`.
2. Factory `kit.name = (stage, opts) => api`; draw into `stage.layer()`; animate only via `stage.onFrame`/`stage.animate`.
   Follow the look above; `update` must accept any in-range value (the page passes in-between values).
3. Physics in `kit.physics` when lessons also need it in `model()`.
4. Add a snippet in `snippets/` (API, physics helper, an "Always visible" note, an example state and scene),
   an entry in `catalog.json`, and document it here. `tests/snippets.test.ts` then runs it automatically.
5. Add a request for it to `eval/requests.json` and run `npm run eval -- --only <id>`.
