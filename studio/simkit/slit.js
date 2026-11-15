/* simkit.doubleSlit: light through two slits and the interference fringes on a screen. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=110, y=80 (top-left), w=780, h=400, wavelength=550 (nm), d=0.2 (mm between the slits),
   *         L=2 (m to the screen), showValues=true (fringe spacing bracket and number) }
   * The screen strip shows 50 mm of the pattern (scale beside it).
   * Returns { update({ wavelength, d, L }), show({ spacing }), showValues(bool), values() }
   * values() -> { spacing (mm between bright fringes) }   (see simkit.physics.fringeSpacing)
   */
  kit.doubleSlit = function (stage, opts) {
    const o = Object.assign({ x: 110, y: 80, w: 780, h: 400, wavelength: 550, d: 0.2, L: 2, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-slit" });
    const mid = o.y + o.h / 2;
    const bx = o.x + 150; // barrier
    const sx = o.x + o.w - 190; // screen strip
    const sw = 70;
    const rows = 160;
    const pxPerMm = o.h / 50;
    const beamIn = kit.el("rect", { x: o.x, y: mid - 26, width: 150, height: 52 }, g);
    const fan = kit.el("polygon", { points: `${bx + 8},${mid - 12} ${sx},${o.y} ${sx},${o.y + o.h} ${bx + 8},${mid + 12}` }, g);
    // Barrier with two slits.
    for (const [y1, y2] of [[o.y + 40, mid - 16], [mid - 6, mid + 6], [mid + 16, o.y + o.h - 40]]) kit.el("rect", { x: bx - 8, y: y1, width: 16, height: y2 - y1, fill: kit.colors.ink }, g);
    kit.el("text", { x: bx, y: o.y + 26, "text-anchor": "middle", class: "simkit-tick", text: "two slits" }, g);
    kit.el("rect", { x: sx, y: o.y, width: sw, height: o.h, fill: "#1d2126" }, g);
    kit.el("text", { x: sx + sw / 2, y: o.y - 12, "text-anchor": "middle", class: "simkit-tick", text: "screen" }, g);
    const bands = Array.from({ length: rows }, (_, i) => kit.el("rect", { x: sx, y: o.y + (i * o.h) / rows, width: sw, height: o.h / rows + 0.6 }, g));
    // Millimetre scale to the right of the screen.
    for (let mm = -20; mm <= 20; mm += 10) {
      const y = mid - mm * pxPerMm;
      kit.el("line", { x1: sx + sw, y1: y, x2: sx + sw + 10, y2: y, stroke: kit.colors.ink, "stroke-width": 2 }, g);
      kit.el("text", { x: sx + sw + 16, y: y + 4, class: "simkit-tick", text: `${mm} mm` }, g);
    }
    const bracket = kit.el("path", { fill: "none", stroke: kit.colors.purple, "stroke-width": 3 }, g);
    const label = kit.el("text", { x: sx - 30, "text-anchor": "end", class: "simkit-label", fill: kit.colors.purple }, g);
    const lamLabel = kit.el("text", { x: o.x, y: mid - 40, class: "simkit-label", fill: kit.colors.ink }, g);
    let showSpacing = o.showValues;
    const sol = () => ({ spacing: kit.physics.fringeSpacing(o.wavelength, o.d, o.L) });

    function draw() {
      const color = kit.lightColor(o.wavelength);
      const { spacing } = sol();
      kit.set(beamIn, { fill: color, opacity: 0.45 });
      kit.set(fan, { fill: color, opacity: 0.12 });
      bands.forEach((b, i) => {
        const mm = (mid - (o.y + ((i + 0.5) * o.h) / rows)) / pxPerMm;
        kit.set(b, { fill: color, opacity: (Math.cos((Math.PI * mm) / spacing) ** 2).toFixed(3) });
      });
      kit.set(lamLabel, { text: `λ = ${kit.fmt(o.wavelength, 0)} nm` });
      // Bracket from the central bright fringe to the next one above it.
      const y2 = mid - spacing * pxPerMm;
      const fits = y2 > o.y + 4;
      kit.set(bracket, { d: showSpacing && fits ? `M ${sx - 8} ${mid} L ${sx - 20} ${mid} L ${sx - 20} ${y2.toFixed(1)} L ${sx - 8} ${y2.toFixed(1)}` : "" });
      kit.set(label, { y: (mid + y2) / 2 + 5, text: showSpacing && fits ? `${kit.fmt(spacing, 1)} mm` : "" });
    }

    draw();

    return {
      update(next) {
        if (next.wavelength != null) o.wavelength = next.wavelength;
        if (next.d != null) o.d = Math.max(0.01, next.d);
        if (next.L != null) o.L = Math.max(0.1, next.L);
        draw();
      },
      /** show({ spacing: false }) removes the bracket and its number; the fringes and the scale stay. */
      show(which) {
        if (which.spacing != null) showSpacing = which.spacing;
        draw();
      },
      showValues(visible) {
        showSpacing = visible;
        draw();
      },
      values: sol,
    };
  };
})();
