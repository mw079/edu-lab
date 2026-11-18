// kit.photoelectric(stage, { x, y, w, h (the tube), wavelength (nm), intensity (%), work (eV), metal, showValues })
// → { update({ wavelength, intensity, work, metal }), showValues(bool), values() }
// Physics for derived values: simkit.physics.photoelectric(wavelengthNm, workEV)
//   → { photonEV (= 1240 / wavelength), emitted (true/false), keEV (= photonEV − work, 0 if not emitted),
//     stopV (volts), thresholdNm (= 1240 / work) }
// Work functions in eV: caesium 2.1, sodium 2.3, calcium 2.9, zinc 4.3, copper 4.7, platinum 5.6.
// Always visible: the light's colour and brightness, the metal's name, and the electrons: none above the
// threshold wavelength, more of them for brighter light, faster for shorter wavelengths. Energies are never
// written on the picture; the wavelength label is hidden with showValues(false).
// Wavelength 150–800 nm. Leaves 90 px free above y for the lamp and 40 px below y + h for the labels.
// Example state: { wavelength: 400, intensity: 60, work: 2.3 }
function (stage, kit) {
  const tube = kit.photoelectric(stage, { x: 200, y: 150, w: 600, h: 280, metal: "sodium" });
  return {
    update(s) {
      tube.update({ wavelength: s.wavelength, intensity: s.intensity, work: s.work });
    },
  };
}
