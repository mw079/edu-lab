// kit.membrane(stage, { x, y, w, h, left, right (particles on each side at the start, 0–20), pores (open
//   channels, 0–5), minutes (time passed), showValues })
// → { update({ left, right, pores, minutes }), show({ values }), values() }
// Physics for derived values: simkit.physics.diffusion(left, right, minutes, pores)
//   → { left, right (particles now), difference, rate (net particles per minute, left → right), equilibrium }
//   Both sides move towards the average; the difference halves every ln 2 ÷ (0.1 × pores) minutes.
// Use sliders: left and right 0–20 (step 1 or 2), pores 0–5, minutes 0–30.
// Always visible: the particles on each side (they can be counted), the channels, the time and the net-flow
// arrow. The written counts become "? particles" with show({ values: false }).
// Occupies x … x+w, y−60 … y+h+80.
// Direct interaction: with click: { left: app.link("left"), right: app.link("right") } the student adds or
// removes particles with + and − buttons under each side (pass only the links whose sliders exist).
// Example state: { left: 16, right: 4, pores: 2, minutes: 0 }
function (stage, kit, app) {
  const cell = kit.membrane(stage, { x: 150, y: 100, w: 700, h: 300, click: { left: app.link("left"), right: app.link("right") } });
  return {
    update(s, d, info) {
      cell.update({ left: s.left, right: s.right, pores: s.pores, minutes: s.minutes });
      cell.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
