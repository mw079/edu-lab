// kit.equilibrium(stage, { x, y (top left), a, b, c (mol/L at the start, 0–5), temp (°C, 0–100), K (at 25 °C),
//   dH (kJ/mol for the forward reaction A + B → C; negative = gives out heat), showResult })
// → { update({ a, b, c, temp, K, dH }), show({ result }), run() → Promise (the mixture settles), values() }
// Physics for derived values: simkit.physics.equilibrium(a, b, c, temp, K, dH)
//   → { a, b, c (mol/L at equilibrium), K (at this temperature), Q (at the start), formed, shift ("right", "left", "none") }
//   Le Chatelier: adding A or B shifts right (more C); adding C shifts left; heating an exothermic reaction (dH < 0)
//   lowers K and shifts left. Example: a = b = 2, c = 0, 25 °C, K = 2 → a = b = 0.78, c = 1.22, shifts right.
// Use sliders: a, b, c 0–5 (step 0.5), temp 0–100 (step 25). Keep K = 2 and dH = −40 unless the lesson needs others.
// Always visible: the reaction, the temperature and the start amounts (pale bars). The equilibrium bars, the shift,
// K and the settled mixture are hidden with show({ result: false }) (the box then shows the start mixture).
// Occupies x … x+910, y … y+460: use it alone on the stage.
// Direct interaction: with drag: { a: app.link("a") } the student drags the top of A's start bar to add or remove A.
// Example state: { a: 2, b: 2, c: 0, temp: 25 }
function (stage, kit, app) {
  const eq = kit.equilibrium(stage, { x: 40, y: 40, drag: { a: app.link("a") } });
  return {
    update(s, d, info) {
      eq.update({ a: s.a, b: s.b, c: s.c, temp: s.temp });
      eq.show({ result: info.solved || !info.hidden.has("cEq") });
    },
    run() {
      return eq.run();
    },
  };
}
