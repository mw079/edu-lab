/* simkit.gasBox: ideal gas in a cylinder with a movable piston, thermometer and pressure gauge. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=80, y=120, w=520, h=300, n=1 (mol), T=300 (K), V=20 (L), Vmax=40 (L),
   *         Pmax=400 (kPa, gauge full scale), particlesPerMol=30, showGauge=true, showThermometer=true,
   *         showValues=true (numbers on gauge/thermometer) }
   * Returns { update({ n, T, V }), showValues(bool), pressure() }   pressure in kPa.
   */
  kit.gasBox = function (stage, opts) {
    const o = Object.assign(
      { x: 80, y: 120, w: 520, h: 300, n: 1, T: 300, V: 20, Vmax: 40, Pmax: 400, particlesPerMol: 30, showGauge: true, showThermometer: true, showValues: true },
      opts
    );
    const g = stage.layer({ class: "simkit-gas" });
    const wall = 10;
    const inner = { x: o.x + wall, y: o.y + wall, h: o.h - 2 * wall, wMax: o.w - 2 * wall - 30 };

    kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 16, fill: "#fff", stroke: kit.colors.steel, "stroke-width": wall }, g);
    const gasFill = kit.el("rect", { x: inner.x, y: inner.y, height: inner.h, fill: "#dfeaff" }, g);
    const dotsG = kit.el("g", null, g);
    const piston = kit.el("g", null, g);
    const pistonPlate = kit.el("rect", { y: inner.y, width: 18, height: inner.h, rx: 4, fill: kit.colors.steel }, piston);
    const pistonRod = kit.el("rect", { y: inner.y + inner.h / 2 - 7, height: 14, fill: kit.colors.steel }, piston);
    const vLabel = kit.el("text", { y: o.y + o.h + 30, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink }, g);

    // Thermometer.
    const thermo = kit.el("g", null, g);
    const tx = o.x + o.w + 70;
    const tTop = o.y;
    const tBot = o.y + o.h - 30;
    const tMin = 0;
    const tMax = 800;
    kit.el("rect", { x: tx - 11, y: tTop, width: 22, height: tBot - tTop + 10, rx: 11, fill: "#fff", stroke: kit.colors.line, "stroke-width": 2 }, thermo);
    kit.el("circle", { cx: tx, cy: tBot + 18, r: 20, fill: kit.colors.red }, thermo);
    const mercury = kit.el("rect", { x: tx - 6, width: 12, rx: 6, fill: kit.colors.red }, thermo);
    const tLabel = kit.el("text", { x: tx, y: tBot + 62, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.redDark }, thermo);

    // Pressure gauge.
    const gauge = kit.el("g", null, g);
    const gx = o.x + o.w + 210;
    const gy = o.y + 100;
    const gr = 74;
    const pipeY = o.y - 24;
    kit.el("polyline", { points: `${o.x + 50},${o.y} ${o.x + 50},${pipeY} ${gx},${pipeY} ${gx},${gy - gr}`, fill: "none", stroke: kit.colors.steel, "stroke-width": 8, "stroke-linejoin": "round" }, gauge);
    kit.el("circle", { cx: gx, cy: gy, r: gr, fill: "#fff", stroke: kit.colors.ink, "stroke-width": 4 }, gauge);
    const ang = (f) => Math.PI * (0.75 + 1.5 * f); // 0 -> lower left, 1 -> lower right
    for (let i = 0; i <= 8; i++) {
      const a = ang(i / 8);
      const r1 = gr - (i % 2 ? 10 : 16);
      kit.el("line", { x1: gx + Math.cos(a) * r1, y1: gy + Math.sin(a) * r1, x2: gx + Math.cos(a) * (gr - 4), y2: gy + Math.sin(a) * (gr - 4), stroke: kit.colors.ink, "stroke-width": 2 }, gauge);
      if (i % 2 === 0)
        kit.el("text", { x: gx + Math.cos(a) * (gr - 30), y: gy + Math.sin(a) * (gr - 30) + 4, "text-anchor": "middle", class: "simkit-tick", text: Math.round((o.Pmax * i) / 8) }, gauge);
    }
    kit.el("text", { x: gx, y: gy + 34, "text-anchor": "middle", class: "simkit-tick", text: "kPa" }, gauge);
    const needle = kit.el("line", { x1: gx, y1: gy, stroke: kit.colors.red, "stroke-width": 4, "stroke-linecap": "round" }, gauge);
    kit.el("circle", { cx: gx, cy: gy, r: 7, fill: kit.colors.ink }, gauge);
    const pLabel = kit.el("text", { x: gx, y: gy + gr + 40, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink }, gauge);
    if (!o.showGauge) gauge.style.display = "none";
    if (!o.showThermometer) thermo.style.display = "none";

    let particles = [];
    let showValues = o.showValues;
    const width = () => kit.clamp(o.V / o.Vmax, 0.05, 1) * inner.wMax;

    function syncParticles() {
      const count = kit.clamp(Math.round(o.n * o.particlesPerMol), 1, 160);
      while (particles.length < count) {
        const a = Math.random() * Math.PI * 2;
        particles.push({ x: Math.random() * width(), y: Math.random() * inner.h, dx: Math.cos(a), dy: Math.sin(a), el: kit.el("circle", { r: 6, fill: kit.colors.blue }, dotsG) });
      }
      while (particles.length > count) particles.pop().el.remove();
    }

    function draw() {
      const wpx = width();
      kit.set(gasFill, { width: wpx });
      kit.set(pistonPlate, { x: inner.x + wpx });
      kit.set(pistonRod, { x: inner.x + wpx + 18, width: Math.max(0, o.x + o.w + 20 - (inner.x + wpx + 18)) });
      kit.set(vLabel, { x: inner.x + wpx / 2, text: showValues ? `V = ${kit.fmt(o.V, 1)} L` : "V = ?" });
      const f = kit.clamp((o.T - tMin) / (tMax - tMin), 0, 1);
      const top = tBot - f * (tBot - tTop - 8);
      kit.set(mercury, { y: top, height: tBot + 10 - top });
      kit.set(tLabel, { text: showValues ? `${kit.fmt(o.T, 0)} K` : "? K" });
      const P = api.pressure();
      const a = ang(kit.clamp(P / o.Pmax, 0, 1.02));
      kit.set(needle, { x2: gx + Math.cos(a) * (gr - 14), y2: gy + Math.sin(a) * (gr - 14) });
      kit.set(pLabel, { text: showValues ? `P = ${kit.fmt(P, 1)} kPa` : "P = ?" });
    }

    stage.onFrame((dt) => {
      const speed = 60 * Math.sqrt(o.T / 300);
      const wpx = width();
      particles.forEach((p) => {
        p.x += p.dx * speed * dt;
        p.y += p.dy * speed * dt;
        if (p.x < 6) (p.x = 6), (p.dx = Math.abs(p.dx));
        if (p.x > wpx - 6) (p.x = wpx - 6), (p.dx = -Math.abs(p.dx));
        if (p.y < 6) (p.y = 6), (p.dy = Math.abs(p.dy));
        if (p.y > inner.h - 6) (p.y = inner.h - 6), (p.dy = -Math.abs(p.dy));
        kit.set(p.el, { cx: (inner.x + p.x).toFixed(1), cy: (inner.y + p.y).toFixed(1) });
      });
    });

    const api = {
      update(next) {
        if (next.n != null) o.n = next.n;
        if (next.T != null) o.T = next.T;
        if (next.V != null) o.V = next.V;
        syncParticles();
        draw();
      },
      showValues(visible) {
        showValues = visible;
        draw();
      },
      pressure() {
        return kit.physics.gasPressure(o.n, o.T, o.V);
      },
    };
    syncParticles();
    draw();
    return api;
  };
})();
