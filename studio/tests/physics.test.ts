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
