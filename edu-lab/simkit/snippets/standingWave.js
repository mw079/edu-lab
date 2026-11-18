// kit.standingWave(stage, { x, y (left end of the string), w, L (m), n (harmonic 1–8), speed (m/s), showValues })
// → { update({ n, L, speed }), show({ wavelength }), showValues(bool), values() }   values() → { wavelength, frequency }
// Physics for derived values: simkit.physics.harmonic(n, L, speed) → { wavelength (= 2L / n), frequency (= n·speed / 2L) }
// Always visible: the vibrating string with its loops and nodes (they can be counted) and the string's length.
// The half-wavelength bracket with its number is hidden with show({ wavelength: false }). The frequency and
// the wave speed are never written (the string moves in slow motion). Occupies x−10 … x+w+10, y−80 … y+190.
// Example state: { n: 3, L: 2 }
function (stage, kit) {
  const string = kit.standingWave(stage, { x: 120, y: 230, w: 760, speed: 40 });
  return {
    update(s, d, info) {
      string.update({ n: s.n, L: s.L });
      string.show({ wavelength: info.solved || !info.hidden.has("wavelength") });
    },
  };
}
