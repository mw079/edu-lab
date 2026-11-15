// kit.wave(stage, { x, y (left end of the rest line), w, pxPerM, amplitude (m), wavelength (m), frequency (Hz),
//   showValues })
// → { update({ amplitude, wavelength, frequency }), show({ wavelength, amplitude }), showValues(bool), values() }
// Derived values are plain arithmetic: speed = s.frequency * s.wavelength (m/s), period = 1 / s.frequency (s).
// Always visible: the moving wave over a metre ruler (so the wavelength can be measured) and a red bead that
// bobs up and down once per period. The written wavelength and amplitude are hidden with
// show({ wavelength: false }) or show({ amplitude: false }). Speed, frequency and period are never written.
// Direct interaction: with drag: { amplitude: app.link("amplitude") } the student moves the dashed amplitude
// line up and down (the slider follows). Pass it only when the lesson has an amplitude slider.
// Keep amplitude ≤ 1.2 m, wavelength 1–4 m, frequency 0.2–2 Hz. Occupies x … x+w, y−150 … y+235.
// Example state: { amplitude: 0.5, wavelength: 2, frequency: 1 }
function (stage, kit, app) {
  const wave = kit.wave(stage, { x: 100, y: 250, w: 800, drag: { amplitude: app.link("amplitude") } });
  return {
    update(s, d, info) {
      wave.update({ amplitude: s.amplitude, wavelength: s.wavelength, frequency: s.frequency });
      wave.show({ wavelength: info.solved || !info.hidden.has("wavelength") });
    },
  };
}
