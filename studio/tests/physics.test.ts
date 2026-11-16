import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

// simkit/core.js is a browser script; load it into a sandbox to test the physics helpers.
const ctx: any = {};
ctx.window = ctx;
vm.runInNewContext(readFileSync("simkit/core.js", "utf8"), ctx);
const P = ctx.simkit.physics;
const near = (a: number, b: number, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);

test("projectile: 20 m/s at 45° lands at v²/g and peaks at v²/4g", () => {
  const r = P.projectile(20, 45);
  near(r.range, 400 / 9.8);
  near(r.maxHeight, 400 / (4 * 9.8));
  near(r.time, (2 * 20 * Math.SQRT1_2) / 9.8);
  near(P.projectile(10, 0, 5).time, Math.sqrt(10 / 9.8)); // thrown level from 5 m
});

test("incline: forces on a 2 kg block at 30°, sliding and held by friction", () => {
  const free = P.incline(2, 30, 0);
  near(free.weight, 19.6);
  near(free.normal, 19.6 * Math.cos(Math.PI / 6));
  near(free.a, 4.9);
  const held = P.incline(2, 30, 0.8); // tan 30° ≈ 0.58 < 0.8
  near(held.a, 0);
  near(held.friction, held.parallel);
  near(P.incline(2, 30, 0.2).a, 9.8 * (0.5 - 0.2 * Math.cos(Math.PI / 6)));
});

test("snell: air to glass bends towards the normal; glass to air reflects beyond the critical angle", () => {
  near(P.snell(1, 1.5, 30).theta2, 19.47);
  assert.equal(P.snell(1, 1.5, 30).critical, null);
  near(P.snell(1.5, 1, 30).theta2, 48.59);
  near(P.snell(1.5, 1, 30).critical, 41.81);
  assert.deepEqual([P.snell(1.5, 1, 45).tir, P.snell(1.5, 1, 45).theta2], [true, null]);
});

test("pendulum: 1 m on Earth swings in about 2 s", () => {
  near(P.pendulumPeriod(1), 2.007, 0.001);
});

test("orbit: Kepler's third law and faster motion near the star", () => {
  near(P.orbit(1, 0, 1).period, 1);
  near(P.orbit(4, 0, 1).period, 8);
  near(P.orbit(1, 0, 4).period, 0.5);
  near(P.orbit(1, 0, 1).vPeri, 29.78);
  const o = P.orbit(2, 0.5, 1);
  near(o.rPeri * o.vPeri, o.rAp * o.vAp, 0.01); // angular momentum is conserved
});

test("chemistry and biology helpers", () => {
  near(P.molarity(0.1, 250), 0.4);
  near(P.reactionRate(1, 1, 300), 1);
  near(P.reactionRate(2, 1, 300), 2);
  assert.ok(P.reactionRate(1, 1, 310) > 1.8 && P.reactionRate(1, 1, 310) < 2.1); // roughly doubles per 10 K
  assert.equal(P.photosynthesis(20, 0.1, 30).rate, 8); // light-limited
  assert.equal(P.photosynthesis(20, 0.1, 30).limiting, "light");
  assert.equal(P.photosynthesis(100, 0.04, 30).rate, 16); // CO2-limited
  assert.equal(P.photosynthesis(100, 0.04, 50).rate, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(P.element(11, 10))), { symbol: "Na", name: "Sodium", shells: [2, 8] });
  assert.deepEqual(JSON.parse(JSON.stringify(P.element(17).shells)), [2, 8, 7]);
});

test("lens, lever, buoyancy, charges and photoelectric helpers", () => {
  near(P.lens(20, 60).dImg, 30);
  near(P.lens(20, 60).m, -0.5);
  assert.deepEqual([P.lens(20, 10).dImg, P.lens(20, 10).real, P.lens(20, 10).upright], [-20, false, true]);
  near(P.lens(-20, 20).dImg, -10);
  assert.equal(P.lens(20, 20).dImg, Infinity);
  assert.equal(P.lever(4, 1, 2, 2).balanced, true);
  assert.ok(P.lever(4, 1, 2, 1.5).net > 0); // the left side goes down
  near(P.lever(4, 1, 2, 2).torque1, 39.2);
  assert.deepEqual([P.buoyancy(600, 1000, 1).floats, P.buoyancy(600, 1000, 1).submerged], [true, 0.6]);
  near(P.buoyancy(600, 1000, 1).buoyant, P.buoyancy(600, 1000, 1).weight);
  near(P.buoyancy(2700, 1000, 2).buoyant, 19.6);
  near(P.buoyancy(2700, 1000, 2).weight, 52.92);
  near(P.coulomb(2, -3, 0.5).force, 0.2158, 0.001);
  assert.equal(P.coulomb(2, -3, 0.5).attract, true);
  near(P.coulomb(1, 1, 1).force * 4, P.coulomb(1, 1, 0.5).force); // inverse-square law
  near(P.photoelectric(400, 2.3).keEV, 0.7996, 0.001);
  assert.equal(P.photoelectric(650, 2.3).emitted, false);
  near(P.photoelectric(400, 2.3).thresholdNm, 539.06, 0.01);
});

test("Punnett square and moon phase helpers", () => {
  const cross = P.punnett(1, 1);
  assert.deepEqual([cross.AA, cross.Aa, cross.aa, cross.dominant], [1, 2, 1, 0.75]);
  assert.deepEqual(JSON.parse(JSON.stringify(P.punnett("AA", "aa").cells)), ["Aa", "Aa", "Aa", "Aa"]);
  assert.equal(P.punnett(1, 0).dominant, 0.5);
  assert.equal(P.punnett("Bb", "Bb", "B").aa, 1);
  assert.deepEqual([0, 45, 90, 135, 180, 225, 270, 315, 360].map((a) => P.moonPhase(a).name), [
    "New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent", "New moon",
  ]);
  near(P.moonPhase(90).lit, 0.5);
  near(P.moonPhase(180).day, 14.75);
});

test("motion, pulley, heat, interference and decay helpers", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(P.motion(0, 5, 2, 4))), { x: 36, v: 13 });
  near(P.atwood(3, 2).a, 1.96);
  near(P.atwood(3, 2).tension, 23.52);
  assert.deepEqual([P.atwood(2, 2).a, P.atwood(2, 2).heavier, P.atwood(1, 8).heavier], [0, "none", "m2"]);
  near(P.mixTemp(200, 4.18, 20, 100, 0.39, 100).final, 23.57);
  near(P.mixTemp(100, 4.18, 20, 100, 4.18, 80).final, 50);
  near(P.fringeSpacing(550, 0.2, 2), 5.5);
  assert.deepEqual(JSON.parse(JSON.stringify(P.decay(100, 20, 10))), { fraction: 0.25, remaining: 25 });
  assert.deepEqual([P.stateOf(-5, 0, 100), P.stateOf(20, 0, 100), P.stateOf(100, 0, 100)], ["solid", "liquid", "gas"]);
});

test("equation balancing and natural selection helpers", () => {
  assert.equal(P.balance("water", [2, 1, 2]).balanced, true);
  assert.equal(P.balance("water", [1, 1, 1]).balanced, false);
  assert.deepEqual(JSON.parse(JSON.stringify(P.balance("water", [1, 1, 1]).left)), { H: 2, O: 2 });
  assert.equal(P.balance("ammonia", [1, 3, 2]).balanced, true);
  assert.equal(P.balance("methane", [1, 2, 1, 2]).balanced, true);
  assert.equal(P.balance("rust", [4, 3, 2]).balanced, true);
  assert.equal(P.balance("magnesium", [2, 1, 2]).balanced, true);
  assert.equal(P.balance("water", [0, 0, 0]).balanced, false);
  near(P.selection(0.1, 0.5, 10), 0.1); // bark that hides neither colour changes nothing
  assert.ok(P.selection(0.1, 0.8, 3) > 0.7);
  assert.ok(P.selection(0.9, 0.1, 5) < 0.1);
});

test("standing wave, energy, titration and ecology helpers", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(P.harmonic(2, 2, 40))), { wavelength: 2, frequency: 20 });
  near(P.energyAt(1, 4, 0).v, 8.854, 0.001);
  near(P.energyAt(2, 5, 3).ke, 39.2);
  near(P.energyAt(2, 5, 3).pe + P.energyAt(2, 5, 3).ke, P.energyAt(2, 5, 3).total);
  near(P.titration(0.1, 25, 0.1, 0).pH, 1);
  assert.deepEqual([P.titration(0.1, 25, 0.1, 25).pH, P.titration(0.1, 25, 0.1, 25).equivalence], [7, 25]);
  near(P.titration(0.1, 25, 0.1, 30).pH, 11.96);
  near(P.trophic(10000, 10, 3), 100);
  assert.deepEqual(JSON.parse(JSON.stringify(P.osmosis(0.3, 0.6))), { water: "out", solution: "hypertonic", size: 0.5 });
  assert.deepEqual([P.osmosis(0.3, 0.3).water, P.osmosis(0.6, 0.2).solution], ["none", "hypotonic"]);
});

test("seasons, quadratic and statistics helpers", () => {
  near(P.daylight(3, 45).daylight, 12);
  near(P.daylight(6, 45).daylight, 15.43, 0.05);
  near(P.daylight(6, 0).daylight, 12);
  near(P.daylight(6, 45, 0).daylight, 12);
  assert.deepEqual([P.daylight(6, 45).season, P.daylight(6, -30).season, P.daylight(10, 45).season], ["summer", "winter", "autumn"]);
  assert.equal(P.daylight(12, 80).daylight, 0); // polar night
  near(P.daylight(6, 45).noonSun, 68.5);
  const q = P.quadratic(1, -2, -3);
  assert.deepEqual(JSON.parse(JSON.stringify(q)), { vertex: { x: 1, y: -4 }, roots: [-1, 3], discriminant: 16 });
  assert.equal(P.quadratic(1, 0, 4).roots.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(P.quadratic(1, -4, 4).roots)), [2]);
  assert.deepEqual(JSON.parse(JSON.stringify(P.stats([2, 3, 3, 5, 9]))), { mean: 4.4, median: 3, min: 2, max: 9, range: 7 });
  assert.equal(P.stats([1, 2, 3, 4]).median, 2.5);
});

test("computer science helpers", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(P.bits(5, 4))), [0, 1, 0, 1]);
  assert.deepEqual(JSON.parse(JSON.stringify(P.bits(255))), [1, 1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(["AND", "OR", "XOR", "NAND", "NOR"].map((t) => [P.gate(t, 0, 0), P.gate(t, 0, 1), P.gate(t, 1, 1)].join("")), ["001", "011", "010", "110", "100"]);
  assert.deepEqual([P.gate("NOT", 0), P.gate("not", 1)], [1, 0]);
  const list = [5, 2, 8, 1, 9, 3];
  const start = P.bubbleSort(list, 0);
  assert.deepEqual(JSON.parse(JSON.stringify([start.array, start.next, start.done])), [list, [0, 1], false]);
  const four = P.bubbleSort(list, 4);
  assert.deepEqual(JSON.parse(JSON.stringify([four.array, four.swaps, four.next])), [[2, 5, 1, 8, 9, 3], 2, [4, 5]]);
  const end = P.bubbleSort(list, 99);
  assert.deepEqual(JSON.parse(JSON.stringify([end.array, end.done, end.comparisons === end.total])), [[1, 2, 3, 5, 8, 9], true, true]);
  const sorted = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  assert.deepEqual(JSON.parse(JSON.stringify(P.binarySearch(sorted, 23, 1))), { low: 5, high: 9, mid: 7, found: null, checks: 1, needed: 3 });
  assert.equal(P.binarySearch(sorted, 23, 9).found, 5);
  assert.equal(P.binarySearch(sorted, 24, 9).found, null);
});

test("weather, climate and correlation helpers", () => {
  assert.deepEqual([P.cloudTemperature(0, 1), P.cloudTemperature(100, 1), P.cloudTemperature(0, 0), P.cloudTemperature(100, 0)], [30, 20, 8, 16]);
  assert.equal(P.windSpeed(1020, 1000, 500), 20);
  assert.equal(P.windSpeed(1000, 1000, 500), 0);
  // Batch 7: biology, earth, vectors and trigonometry.
  const dif = P.diffusion(16, 4, 0, 2);
  assert.deepEqual([dif.left, dif.right, dif.equilibrium], [16, 4, 10]);
  near(P.diffusion(16, 4, Math.LN2 / 0.2, 2).difference, 6); // the difference halves every ln 2 ÷ (0.1 × pores)
  near(P.diffusion(16, 4, 1000, 2).left, 10);
  assert.equal(P.diffusion(16, 4, 30, 0).left, 16); // no channels: nothing moves
  const lv = P.predatorPrey(100, 25, 0.5, 0.02, 12); // started at the balance point: stays there
  near(lv.prey, 100);
  near(lv.predators, 25);
  assert.deepEqual([lv.preyEq, lv.predEq], [100, 25]);
  assert.ok(P.predatorPrey(60, 10, 0.5, 0.02, 4).prey > 60);
  assert.deepEqual([...P.basePairs("ATGC", [2, 1, 4, 3]).matches], [true, true, true, true]);
  assert.deepEqual([P.basePairs("ATGC", [2, 1, 4, 0]).correct, P.basePairs("ATGC", [2, 1, 4, 0]).complete, P.basePairs("ATGC", []).bonds], [3, false, 10]);
  assert.deepEqual({ ...P.mitosis(2, 2) }, { name: "metaphase", cells: 1, chromosomes: 4, perCell: 4 });
  assert.deepEqual(P.mitosis(3, 2).chromosomes, 8);
  assert.deepEqual({ ...P.mitosis(5, 2) }, { name: "cytokinesis", cells: 2, chromosomes: 8, perCell: 4 });
  assert.deepEqual({ ...P.plates(4, 20, "ocean-continent") }, { boundary: "convergent", feature: "trench and volcanoes", distance: 800 });
  assert.deepEqual([P.plates(-2, 10, "ocean-ocean").feature, P.plates(-2, 10, "continent-continent").feature, P.plates(5, 1, "continent-continent").feature, P.plates(0, 9, "ocean-ocean").boundary], ["mid-ocean ridge", "rift valley", "mountain range", "none"]);
  const hum = P.humidity(10, 20);
  assert.deepEqual([hum.saturation, hum.relative, hum.condensing], [20, 50, false]);
  near(hum.dewPoint, 10);
  assert.equal(P.humidity(20, 20).condensing, true);
  const vs = P.vectorSum(3, 0, 0, 4);
  assert.deepEqual([vs.x, vs.y, vs.magnitude], [3, 4, 5]);
  near(P.vectorSum(1, 0, -2, 0).angle, 180);
  assert.deepEqual([P.trig(90).sin, P.trig(90).cos, P.trig(90).tan, P.trig(180).cos, P.trig(200).quadrant], [1, 0, null, -1, 3]);
  near(P.trig(30).sin, 0.5);
  // Batch 8: topics from the Google paper's list that had no component.
  assert.deepEqual([P.ph(2, 3).pH, P.ph(2, 9).pH, P.ph(12, 2).pH, P.ph(7, 4).pH, P.ph(3, 0).kind, P.ph(9, 0).kind, P.ph(7, 0).kind], [5, 7, 10, 7, "acid", "base", "neutral"]);
  near(P.ph(4, 0).timesNeutral, 1000);
  near(P.gravity(5.97, 0.0735, 3.84).force, 1.99);
  near(P.gravity(2, 3, 2).force / P.gravity(2, 3, 4).force, 4);
  assert.deepEqual([P.planet(3).name, P.planet(3).period, P.planet(8).name], ["Earth", 1, "Neptune"]);
  near(P.planet(5).period, 11.86, 0.05);
  near(P.planet(4, 3.75).orbits, 2, 0.01);
  assert.deepEqual([P.star(1, 4).name, P.star(10, 4).name, P.star(25, 4).name, P.star(1, 2).name, P.star(10, 3).name, P.star(1).lifetime], ["white dwarf", "neutron star", "black hole", "red giant", "supernova", 10]);
  assert.deepEqual([P.tipping(5, 1).ice, P.tipping(7, 1).ice, P.tipping(8, 1).ice, P.tipping(5, 0).ice, P.tipping(2, 0).ice, P.tipping(8, 1).state], [70, 58, 0, 0, 88, "ice-free"]);
  assert.deepEqual([P.codon("AUG"), P.codon("UAA"), P.codon("GGC"), P.codon("TGG")], ["Met", "Stop", "Gly", "Trp"]);
  const tr = P.translate("AUGGCUUGGUAA", [3, 1, 0, 0]);
  assert.deepEqual([[...tr.protein].join(" "), [...tr.choices].join(" "), [...tr.answer].join(""), tr.correct, tr.complete], ["Met Ala Trp Stop", "Ala Gly Met Ser Stop Trp", "3165", 2, false]);
  assert.equal(P.translate("AUGGCUUGGUAA", [3, 1, 6, 5]).complete, true);
  const sq = P.robot(4, 2, 1);
  assert.deepEqual([sq.x, sq.y, sq.facing, sq.moves, sq.crashed], [1, 1, "east", 8, false]);
  assert.deepEqual([P.robot(3, 2, 0).x, P.robot(2, 3, 1).x, P.robot(2, 3, 1).y, P.robot(2, 3, 1).facing, P.robot(3, 4, 0).crashed, P.robot(3, 4, 0).x], [7, 4, 4, "west", true, 8]);
  assert.deepEqual({ ...P.cuboid(3, 2, 4) }, { surface: 52, volume: 24, base: 6, front: 12, side: 8 });
  assert.deepEqual({ ...P.ratio(2, 3, 8) }, { y: 12, unitRate: 1.5, scale: 4 });
  const sm = P.sampling(40, 20, 30);
  assert.equal(sm.results.length, 30);
  assert.deepEqual([...P.sampling(40, 20, 30).results], [...sm.results]); // the same draws every time
  near(sm.mean, 40, 6);
  near(sm.standardError, 10.95);
  assert.ok(sm.low <= sm.last && sm.last <= sm.high);
  assert.ok(Math.abs(P.sampling(40, 100, 40).mean - 40) < 4);
  near(P.greenhouse(280, 0.3), 14);
  near(P.greenhouse(560, 0.3), 17);
  near(P.greenhouse(280, 0.31), 13);
  const line = P.correlation([[1, 3], [2, 5], [3, 7]]);
  near(line.slope, 2);
  near(line.intercept, 1);
  near(line.r, 1);
  near(P.correlation([[1, 3], [2, 2], [3, 1]]).r, -1);
});
