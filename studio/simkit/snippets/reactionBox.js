// kit.reactionBox(stage, { x, y, w, h, nA, nB (particles at the start, up to 60 each), T (K), Ea (kJ/mol),
//   labelA, labelB })
// → { update({ nA, nB, T, Ea }), run({ duration }) → Promise<number of AB formed>, reset(), stop(), products() }
// Physics for derived values: simkit.physics.reactionRate(cA, cB, T, EaKJ) → relative rate
//   (1 at cA = cB = 1 and 300 K; doubles when one concentration doubles; rises steeply with T)
// Always visible: every particle and the live counts of A, B and AB above the box. Particles move faster when
// hotter and react only while run() plays. The picture is random, so base goals and answers on derived values
// from reactionRate (e.g. with cA = nA / 10), not on the exact number of AB in one run.
// Example state: { nA: 12, nB: 12, T: 300 }   actions: [{ id: "run", label: "Start reaction" }]
function (stage, kit) {
  const box = kit.reactionBox(stage, { x: 240, y: 100, w: 520, h: 360 });
  return {
    update(s) { box.update({ nA: s.nA, nB: s.nB, T: s.T }); },
    reset() { box.reset(); },
    stop() { box.stop(); },
    run() { return box.run({ duration: 6 }); },
  };
}
