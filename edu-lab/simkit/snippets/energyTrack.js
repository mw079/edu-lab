// kit.energyTrack(stage, { x, y, w, h (track area), hMax (m), h0 (release height, m), mass (kg), at, eMax (J), showValues })
// → { update({ h0, mass, at }), show({ speed, bars }), showValues(bool), play({ swings }) → Promise, stop(), reset(), values() }
// `at` places the ball: 0 = release point, 0.5 = bottom of the valley, 1 = the far side (same height as the start).
// values() → { h, pe, ke, total, v } at the ball's place.
// Physics for derived values: simkit.physics.energyAt(mass, h0, h) → { pe (= m·9.8·h), ke (= total − pe), total, v (= √(2·9.8·(h0 − h))) }
//   e.g. at the bottom: simkit.physics.energyAt(s.mass, s.h0, 0).v
// Always visible: the ball's height against the ruler and the dashed release level. Bars show PE, KE and total
// with their joules; the height is written above the track. show({ speed: false }) hides the speed and the KE
// bar; show({ bars: false }) hides all three bars. No friction: the total never changes.
// The bars run from 0 to eMax (100 J by default): keep mass × 9.8 × h0 below it, or pass a larger eMax.
// The bars need 300 px to the right of x + w. Keep h0 between 0.5 and hMax.
// Example state: { h0: 4, mass: 1, at: 0.5 }   actions: [{ id: "play", label: "Release" }]
function (stage, kit) {
  const track = kit.energyTrack(stage, { x: 110, y: 100, w: 480, h: 330, hMax: 5 });
  return {
    update(s, d, info) {
      track.update({ h0: s.h0, mass: s.mass, at: s.at });
      track.show({ speed: info.solved || !info.hidden.has("speed") });
    },
    reset() { track.reset(); },
    stop() { track.stop(); },
    play() { return track.play({ swings: 2 }); },
  };
}
