// kit.doubleSlit(stage, { x, y, w, h, wavelength (nm), d (mm between the slits), L (m to the screen), showValues })
// → { update({ wavelength, d, L }), show({ spacing }), showValues(bool), values() }   values() → { spacing (mm) }
// Physics for derived values: simkit.physics.fringeSpacing(wavelengthNm, dMm, Lm) → mm between bright fringes
//   (= wavelength × L / d; 550 nm, 0.2 mm, 2 m gives 5.5 mm)
// Always visible: the light's colour and wavelength, the fringes on the screen and a millimetre scale beside it
// (the screen strip shows 50 mm). The bracket with the written fringe spacing is hidden with
// show({ spacing: false }). The slit separation d and the distance L are not written on the picture.
// Keep the spacing between 2 and 20 mm (e.g. wavelength 400–700, d 0.1–0.5, L 1–3). Use it alone on the stage.
// Example state: { wavelength: 550, d: 0.2, L: 2 }
function (stage, kit) {
  const slits = kit.doubleSlit(stage, { x: 110, y: 80, w: 780, h: 400 });
  return {
    update(s, d, info) {
      slits.update({ wavelength: s.wavelength, d: s.d, L: s.L });
      slits.show({ spacing: info.solved || !info.hidden.has("spacing") });
    },
  };
}
