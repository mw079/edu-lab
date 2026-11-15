/* simkit.lens: thin lens on an optical axis with an object arrow, its image and two principal rays. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500, y=280 (lens centre, on the axis), pxPerCm=4, f=20 (cm; negative = diverging lens),
   *         dObj=50 (cm in front of the lens), hObj=15 (cm), showImage=true (image and the rays behind the lens) }
   * Returns { update({ f, dObj, hObj }), showImage(bool), values() }
   * values() -> { dImg, m, real, upright, hImg }   (cm; see simkit.physics.lens)
   */
  kit.lens = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 280, pxPerCm: 4, f: 20, dObj: 50, hObj: 15, showImage: true }, opts);
    const g = stage.layer({ class: "simkit-lens" });
    const half = { w: 470, h: 240 };
    const clip = kit.el("clipPath", { id: stage.uid("lens") }, stage.defs);
    kit.el("rect", { x: o.x - half.w, y: o.y - half.h, width: 2 * half.w, height: 2 * half.h }, clip);
    kit.el("line", { x1: o.x - half.w, y1: o.y, x2: o.x + half.w, y2: o.y, stroke: kit.colors.muted, "stroke-width": 2, "stroke-dasharray": "10 6" }, g);
    const dynamic = kit.el("g", { "clip-path": `url(#${stage.uid("lens")})` }, g);
    const labels = kit.el("g", null, g);

    const sol = () => {
      const v = kit.physics.lens(o.f, o.dObj);
      return Object.assign(v, { hImg: v.m * o.hObj });
    };

    function draw() {
      dynamic.textContent = "";
      labels.textContent = "";
      const px = o.pxPerCm;
      const v = sol();
      const H = 190;
      // Lens: fat in the middle (converging) or thin in the middle (diverging).
      const d = o.f >= 0
        ? `M ${o.x} ${o.y - H} Q ${o.x + 34} ${o.y} ${o.x} ${o.y + H} Q ${o.x - 34} ${o.y} ${o.x} ${o.y - H} Z`
        : `M ${o.x - 16} ${o.y - H} L ${o.x + 16} ${o.y - H} Q ${o.x + 2} ${o.y} ${o.x + 16} ${o.y + H} L ${o.x - 16} ${o.y + H} Q ${o.x - 2} ${o.y} ${o.x - 16} ${o.y - H} Z`;
      kit.el("path", { d, fill: "#cfe3f7", stroke: kit.colors.blue, "stroke-width": 2, "fill-opacity": 0.8 }, dynamic);
      // Focal points on both sides.
      for (const side of [-1, 1]) {
        const fx = o.x + side * Math.abs(o.f) * px;
        if (Math.abs(fx - o.x) > half.w - 10) continue;
        kit.el("circle", { cx: fx, cy: o.y, r: 5, fill: kit.colors.ink }, dynamic);
        kit.el("text", { x: fx, y: o.y + 24, "text-anchor": "middle", class: "simkit-tick", text: "F" }, labels);
      }
      // Object arrow.
      const xo = o.x - o.dObj * px;
      const yo = o.y - o.hObj * px;
      kit.arrowShape(dynamic, xo, o.y, xo, yo, { color: kit.colors.green, width: 6, head: 14 });
      kit.el("text", { x: xo, y: yo - 12, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.greenDark, text: "object" }, labels);
      // Rays from the top of the object to the lens.
      const ray = (x1, y1, x2, y2, dashed) => kit.el("line", { x1, y1, x2, y2, stroke: kit.colors.orange, "stroke-width": 2.5, "stroke-dasharray": dashed ? "7 6" : null, opacity: dashed ? 0.7 : 1 }, dynamic);
      ray(xo, yo, o.x, yo);
      ray(xo, yo, o.x, o.y);
      if (!o.showImage) return;
      // Behind the lens: the parallel ray bends through (or away from) the focal point; the central ray goes straight.
      const far = 2000;
      const dir1 = [Math.abs(o.f) * px, Math.sign(o.f || 1) * (o.y - yo)];
      ray(o.x, yo, o.x + dir1[0] * (far / dir1[0]), yo + dir1[1] * (far / dir1[0]));
      ray(o.x, o.y, o.x + far, o.y + ((o.y - yo) / (o.x - xo)) * far);
      if (!Number.isFinite(v.dImg)) {
        kit.el("text", { x: o.x + half.w - 8, y: o.y - half.h + 22, "text-anchor": "end", class: "simkit-label", fill: kit.colors.purple, text: "no image: the rays leave parallel" }, labels);
        return;
      }
      const xi = o.x + v.dImg * px;
      const yi = o.y - v.hImg * px;
      const inside = Math.abs(xi - o.x) < half.w - 20 && Math.abs(yi - o.y) < half.h - 20;
      if (!v.real) {
        ray(o.x, yo, xi, yi, true);
        ray(xo, yo, xi, yi, true);
      }
      if (!inside) {
        kit.el("text", { x: v.real ? o.x + half.w - 8 : o.x - half.w + 8, y: o.y - half.h + 22, "text-anchor": v.real ? "end" : "start", class: "simkit-label", fill: kit.colors.purple, text: "the image is off the picture" }, labels);
        return;
      }
      const arrow = kit.arrowShape(dynamic, xi, o.y, xi, yi, { color: kit.colors.purple, width: 6, head: 14 });
      if (!v.real) arrow.setAttribute("opacity", 0.55);
      const text = v.real ? "image" : "image (virtual)";
      // Upside-down images are labelled under their tip; upright ones beside the tip (magnified) or under the axis (reduced).
      if (!v.upright) kit.el("text", { x: xi, y: yi + 26, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.purple, text }, labels);
      else if (xi > xo) kit.el("text", { x: xi, y: o.y + 50, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.purple, text }, labels);
      else kit.el("text", { x: xi - 12, y: yi + 4, "text-anchor": "end", class: "simkit-label", fill: kit.colors.purple, text }, labels);
    }

    draw();

    return {
      update(next) {
        if (next.f != null && next.f !== 0) o.f = next.f;
        if (next.dObj != null) o.dObj = Math.max(1, next.dObj);
        if (next.hObj != null) o.hObj = next.hObj;
        draw();
      },
      showImage(visible) {
        o.showImage = visible;
        draw();
      },
      values: sol,
    };
  };
})();
