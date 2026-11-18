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
| `kit.only(link, when)` | A link that works only while `when()` is true (e.g. dragging that applies to one mode of a component). |
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
| `kit.physics.diffusion(left, right, minutes, pores)` | `{ left, right, difference, rate, equilibrium }`. |
| `kit.physics.predatorPrey(prey0, pred0, birth, hunt, years)` | `{ prey, predators, preyEq, predEq, series }`. |
| `kit.physics.basePairs(template, bases)` | `{ matches, correct, complete, bonds }`; bases 0–4 = empty, A, T/U, G, C. |
| `kit.physics.mitosis(stage, pairs)` | `{ name, cells, chromosomes, perCell }` for stages 0–5. |
| `kit.physics.plates(speed, millionYears, kind)` | `{ boundary, feature, distance (km) }`. |
| `kit.physics.humidity(vapour, tempC)` | `{ saturation, relative, dewPoint, condensing }`. |
| `kit.physics.vectorSum(ax, ay, bx, by)` | `{ x, y, magnitude, angle, magA, magB }`. |
| `kit.physics.trig(angleDeg)` | `{ sin, cos, tan, quadrant }`. |
| `kit.physics.ph(pH, dilutions)` | `{ pH, kind, exponent, timesNeutral }`. |
| `kit.physics.gravity(m1, m2, r)` | `{ force }` in 10²⁰ N, masses in 10²⁴ kg, distance in 10⁸ m. |
| `kit.physics.planet(index, years)` | `{ name, a, period, speed, orbits }` for planets 1–8. |
| `kit.physics.star(mass, stage)` | `{ lifetime, temperature, massive, fate, stages, name }`. |
| `kit.physics.tipping(heating, startIce)` | `{ ice, state, temperature }` with a collapse above 7 and no return until below 3. |
| `kit.physics.codon(triplet)`, `translate(mrna, picks)` | Amino acid name; `{ codons, protein, choices, answer, matches, correct, complete }`. |
| `kit.physics.robot(repeat, forward, turn)` | `{ x, y, facing, path, moves, crashed }` on an 8 × 6 grid. |
| `kit.physics.cuboid(l, w, h)` | `{ surface, volume, base, front, side }`. |
| `kit.physics.ratio(a, b, x)` | `{ y, unitRate, scale }`. |
| `kit.physics.sampling(percent, size, count)` | `{ results, last, mean, standardError, low, high, contains }`, repeatable. |
| `kit.physics.pulley(load, ropes, lift)`, `gears(driver, driven, turns)` | `{ effort, advantage, pull, work }`; `{ ratio, outTurns, speedTimes, forceTimes, direction }`. |
| `kit.physics.induction(turns, speed, strength)` | `{ emf (mV), size, direction }`; + speed = into the coil. |
| `kit.physics.electromagnet(turns, current, core)` | `{ field (mT), clips, north }`; an iron core (1) makes it 200 times stronger. |
| `kit.physics.mirror(f, dObj)` | Concave mirror: `{ dImg, m, real, upright }`. |
| `kit.physics.circular(m, v, r)` | `{ force, accel, period, omega }`. |
| `kit.physics.periodic(z)` | Elements 1–20: `{ symbol, name, group, period, valence, shells, radius, electronegativity, ionization, kind }`. |
| `kit.physics.equilibrium(a, b, c, tempC, K25, dH)` | A + B ⇌ C: `{ a, b, c, K, Q, formed, shift }`. |
| `kit.physics.enzyme(tempC, pH, bestTemp, bestPH)` | `{ rate (%), denatured, tempFactor, pHFactor }`. |
| `kit.physics.cellParts`, `cellPart(index, kind)` | The 8 parts of a plant/animal cell; `{ name, job, present, partsInCell }`. |
| `kit.physics.rockCycle(rock)` | `{ name, next: [{ process, to, name }] }` for rocks 0–4. |
| `kit.physics.transform(points, kind, a, b)` | Image of a shape after translation, reflection, rotation or enlargement. |

## Components

Each component's options, return value, physics helper, "Always visible" note and drag/click option are in the
comment at the top of its usage example in `snippets/<id>.js` (the generator reads them from there);
`catalog.json` lists them all with topics.

## Direct interaction

A scene receives `app` as its third argument. `app.link("controlKey")` returns a setter for that control; a
component that is given one lets the student drag or click the object, and calls the setter with the new value.
The lesson page snaps the value to the control's range and step, keeps the slider in step, and disables the
link in steps where the control is locked (so question steps cannot be solved by dragging).

Each snippet's "Direct interaction" note names the option and what the student does.

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

1. New file in `simkit/` (lessons pick it up automatically: `server/lesson.ts` reads the folder).
2. Factory `kit.name = (stage, opts) => api`; draw into `stage.layer()`; animate only via `stage.onFrame`/`stage.animate`.
   Follow the look above; `update` must accept any in-range value (the page passes in-between values).
3. Physics in `kit.physics` when lessons also need it in `model()`.
4. Add a snippet in `snippets/` (API, physics helper, an "Always visible" note, an example state and scene),
   and an entry in `catalog.json`. `tests/snippets.test.ts` then runs it automatically, and `tests/extremes.test.ts`
   draws it at both ends of every range the comment gives as "key a–b" (or "key (unit, a–b)"), so write each slider's
   range that way.
5. If it can be dragged or clicked, add its id to the list in the "draggable and clickable" test.
6. Add a request for it to `eval/requests.json` and run `npm run eval -- --only <id>`.
