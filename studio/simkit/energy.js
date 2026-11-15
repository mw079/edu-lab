/* simkit.energyTrack: a ball rolling in a frictionless valley, with bars for its potential and kinetic energy. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=110, y=90 (top-left of the track area), w=480, h=330, hMax=5 (m at the top of the track),
   *         h0=4 (m, release height), mass=1 (kg), eMax=100 (J at the top of the bars), at=0 (0 = release point, 0.5 = bottom, 1 = far side),
   *         showValues=true }
   * Returns { update({ h0, mass, at }), show({ speed, bars }), showValues(bool), play({ swings }) -> Promise,
   *   stop(), reset(), values() }
   * values() -> { h (m), pe, ke, total (J), v (m/s) }   (see simkit.physics.energyAt)
   */
  kit.energyTrack = function (stage, opts) {
    const o = Object.assign({ x: 110, y: 90, w: 480, h: 330, hMax: 5, h0: 4, mass: 1, at: 0, eMax: 100, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-energy" });
    const shown = { speed: o.showValues, bars: true };
    const cx = o.x + o.w / 2;
    const ground = o.y + o.h;
    const pxPerM = (o.h - 20) / o.hMax;
    const half = o.w / 2 - 10;
    const H = (dx) => o.hMax * (dx / half) ** 2; // height of the track dx px from the middle
    // Height ruler on the left.
    kit.el("line", { x1: o.x - 30, y1: ground, x2: o.x - 30, y2: ground - o.hMax * pxPerM, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    for (let m = 0; m <= o.hMax; m++) {
      kit.el("line", { x1: o.x - 38, y1: ground - m * pxPerM, x2: o.x - 30, y2: ground - m * pxPerM, stroke: kit.colors.ink, "stroke-width": 2 }, g);
      kit.el("text", { x: o.x - 44, y: ground - m * pxPerM + 4, "text-anchor": "end", class: "simkit-tick", text: `${m} m` }, g);
    }
    let d = "";
    for (let dx = -half; dx <= half; dx += 6) d += `${d ? "L" : "M"} ${cx + dx} ${(ground - H(dx) * pxPerM).toFixed(1)} `;
    kit.el("path", { d: `${d} L ${cx + half} ${ground + 8} L ${cx - half} ${ground + 8} Z`, fill: "#e9e4d8", stroke: "none" }, g);
    kit.el("path", { d, fill: "none", stroke: kit.colors.ink, "stroke-width": 4, "stroke-linecap": "round" }, g);
    const level = kit.el("line", { x1: o.x - 30, x2: cx + half, stroke: kit.colors.orange, "stroke-width": 2, "stroke-dasharray": "5 6" }, g);
    const ball = kit.el("circle", { r: 14, fill: kit.colors.purple, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    const speedLabel = kit.el("text", { "text-anchor": "middle", class: "simkit-label", fill: kit.colors.purple }, g);
    // Energy bars to the right of the track.
    const bx = o.x + o.w + 70;
    const barH = o.h - 60;
    const bars = [["PE", kit.colors.blue], ["KE", kit.colors.green], ["total", kit.colors.steel]].map(([name, color], i) => {
      const x = bx + i * 80;
      kit.el("rect", { x, y: ground - barH, width: 44, height: barH, fill: "#fff", stroke: kit.colors.line, "stroke-width": 2 }, g);
      kit.el("text", { x: x + 22, y: ground + 22, "text-anchor": "middle", class: "simkit-label", fill: color, text: name }, g);
      return { fill: kit.el("rect", { x, width: 44, fill: color }, g), value: kit.el("text", { x: x + 22, y: ground - barH - 10, "text-anchor": "middle", class: "simkit-tick" }, g) };
    });
    let anim = null;
    let at = o.at;

    const where = () => {
      const h0 = kit.clamp(o.h0, 0.1, o.hMax);
      const x0 = half * Math.sqrt(h0 / o.hMax);
      const dx = -x0 * Math.cos(Math.PI * kit.clamp(at, 0, 1)); // from −x0 through 0 to +x0
      return { h0, dx, h: H(dx) };
    };
    const sol = () => {
      const p = where();
      return Object.assign({ h: p.h }, kit.physics.energyAt(o.mass, p.h0, p.h));
    };

    function draw() {
      const p = where();
      const v = sol();
      const slope = (2 * o.hMax * p.dx) / (half * half) * pxPerM; // rise in px per px
      const len = Math.hypot(1, slope);
      // The ball sits on the track: its centre is one radius away along the track's normal.
      kit.set(ball, { cx: (cx + p.dx - (14 * slope) / len).toFixed(1), cy: (ground - p.h * pxPerM - 14 / len).toFixed(1) });
      kit.set(level, { y1: ground - p.h0 * pxPerM, y2: ground - p.h0 * pxPerM });
      kit.set(speedLabel, { x: cx, y: o.y - 14, text: shown.speed ? `height ${kit.fmt(p.h, 2)} m · speed ${kit.fmt(v.v, 1)} m/s` : `height ${kit.fmt(p.h, 2)} m` });
      const full = o.eMax; // one fixed scale, so equal joules always look equal
      [v.pe, v.ke, v.total].forEach((E, i) => {
        const hide = !shown.bars || (i === 1 && !shown.speed);
        const hpx = hide ? 0 : (kit.clamp(E / full, 0, 1) * barH);
        kit.set(bars[i].fill, { y: ground - hpx, height: hpx });
        kit.set(bars[i].value, { text: hide ? "?" : `${kit.fmt(E, 1)} J` });
      });
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
    }

    draw();

    return {
      update(next) {
        stop();
        for (const key of ["h0", "mass", "at"]) if (next[key] != null) o[key] = next[key];
        at = o.at;
        draw();
      },
      /** show({ speed: false }) hides the speed and the KE bar; show({ bars: false }) hides all three bars. */
      show(which) {
        if (which.speed != null) shown.speed = which.speed;
        if (which.bars != null) shown.bars = which.bars;
        draw();
      },
      showValues(visible) {
        shown.speed = visible;
        draw();
      },
      values: sol,
      stop,
      reset() {
        stop();
        at = o.at;
        draw();
      },
      /** Release the ball; it rolls to the far side and back `swings` times (default 2), then returns to its place. */
      play(params) {
        stop();
        const swings = (params && params.swings) || 2;
        anim = stage.animate(swings * 3, (_p, t) => {
          at = (1 - Math.cos((2 * Math.PI * t) / 3)) / 2;
          draw();
        });
        return anim.then((done) => {
          at = o.at;
          draw();
          return done;
        });
      },
    };
  };
})();
