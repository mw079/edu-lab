// kit.projectile(stage, { x, y (ground at the launch point), w, xMax (metres of ground shown), v0 (m/s),
//   angle (deg above horizontal), h0 (launch height, m), g, showPath })
// → { update({ v0, angle, h0, g }), showPath(bool), launch() → Promise, reset(), stop(), values() }
// Physics for derived values: simkit.physics.projectile(v0, angleDeg, h0, g)
//   → { vx, vy, time, range, maxHeight }   (g defaults to 9.8)
// Always visible: launch speed and angle (on the arrow) and the distance marks on the ground. The landing
// distance appears only after launch(); the dashed path only with showPath(true). In a step that asks for the
// range, lock the launch action. Choose xMax a little above the largest possible range. Same scale on both
// axes: with xMax = 50 the stage shows about 25 m of height.
// Example state: { v0: 20, angle: 45 }   actions: [{ id: "launch", label: "Launch" }]
function (stage, kit) {
  const shot = kit.projectile(stage, { x: 80, y: 470, w: 840, xMax: 50 });
  return {
    update(s) { shot.update({ v0: s.v0, angle: s.angle }); },
    reset() { shot.reset(); },
    stop() { shot.stop(); },
    launch() { return shot.launch(); },
  };
}
