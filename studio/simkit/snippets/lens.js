// kit.lens(stage, { x, y (lens centre), pxPerCm, f (cm; negative = diverging), dObj (cm), hObj (cm), showImage })
// → { update({ f, dObj, hObj }), showImage(bool), values() }   values() → { dImg, m, real, upright, hImg }
// Physics for derived values: simkit.physics.lens(f, dObj) → { dImg, m, real, upright }
//   1/f = 1/dObj + 1/dImg, m = −dImg/dObj. dImg < 0: virtual image on the object's side. m < 0: upside down.
// Always visible: the lens, both focal points (F), the object and the two rays up to the lens. Distances are
// not written on the picture. The image and the rays behind the lens are hidden with showImage(false): use
// it in a step that asks where the image is or how big it is.
// With pxPerCm 4 the picture shows 115 cm on each side of the lens; keep dObj and |f| between 10 and 100 cm
// and hObj at most 20 cm. Occupies x ± 470, y ± 240: use it alone on the stage.
// Example state: { f: 20, dObj: 50 }
function (stage, kit) {
  const lens = kit.lens(stage, { x: 500, y: 280, hObj: 15 });
  return {
    update(s, d, info) {
      lens.update({ f: s.f, dObj: s.dObj });
      lens.showImage(info.solved || !info.hidden.has("dImg"));
    },
  };
}
