/* simkit.standingWave: a string fixed at both ends vibrating in one of its harmonics. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=120, y=250 (left end of the string), w=760, L=2 (m, the string's length), n=1 (harmonic, 1–8),
   *         speed=40 (m/s, wave speed on the string), showValues=true }
   * The string moves in slow motion. Returns { update({ n, L, speed }), show({ wavelength }), showValues(bool), values() }
   * values() -> { wavelength (m), frequency (Hz) }   (see simkit.physics.harmonic)
   */
  kit.standingWave = function (stage, opts) {
    const o = Object.assign({ x: 120, y: 250, w: 760, L: 2, n: 1, speed: 40, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-standing" });
    let showWavelength = o.showValues;
    const A = 70;
    for (const ex of [o.x, o.x + o.w]) kit.el("rect", { x: ex - 8, y: o.y - 40, width: 16, height: 80, rx: 4, fill: kit.colors.steel }, g);
    const envelope = [1, -1].map(() => kit.el("path", { fill: "none", stroke: kit.colors.line, "stroke-width": 2, "stroke-dasharray": "6 6" }, g));
    const string = kit.el("path", { fill: "none", stroke: kit.colors.blue, "stroke-width": 5, "stroke-linecap": "round" }, g);
    const marks = kit.el("g", null, g);
    kit.el("path", { d: `M ${o.x} ${o.y + 150} L ${o.x} ${o.y + 158} L ${o.x + o.w} ${o.y + 158} L ${o.x + o.w} ${o.y + 150}`, fill: "none", stroke: kit.colors.ink, "stroke-width": 2 }, g);
    const lengthLabel = kit.el("text", { x: o.x + o.w / 2, y: o.y + 182, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink }, g);
    let time = 0;
    const n = () => kit.clamp(Math.round(o.n), 1, 8);
    const shape = (scale) => {
      let d = "";
      for (let px = 0; px <= o.w; px += 4) d += `${px ? "L" : "M"} ${o.x + px} ${(o.y - scale * A * Math.sin((n() * Math.PI * px) / o.w)).toFixed(1)} `;
      return d;
    };

    function drawStatic() {
      marks.textContent = "";
      envelope.forEach((p, i) => kit.set(p, { d: shape(i ? -1 : 1) }));
      // Nodes: the points that never move.
      for (let i = 0; i <= n(); i++) kit.el("circle", { cx: o.x + (i * o.w) / n(), cy: o.y, r: 6, fill: kit.colors.ink }, marks);
      kit.set(lengthLabel, { text: `string length ${kit.fmt(o.L, 2)} m` });
      if (!showWavelength) return;
      // One loop is half a wavelength.
      const loop = o.w / n();
      const by = o.y + A + 26;
      kit.el("path", { d: `M ${o.x} ${by - 8} L ${o.x} ${by} L ${o.x + loop} ${by} L ${o.x + loop} ${by - 8}`, fill: "none", stroke: kit.colors.purple, "stroke-width": 3 }, marks);
      kit.el("text", { x: o.x + Math.max(loop / 2, 70), y: by + 24, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.purple, text: `half a wavelength: ${kit.fmt(o.L / n(), 2)} m` }, marks);
    }

    stage.onFrame((dt) => {
      time += dt;
      kit.set(string, { d: shape(Math.cos(time * 2 * Math.PI * 0.5 * Math.sqrt(n()))) });
    });
    drawStatic();
    kit.set(string, { d: shape(1) });

    return {
      update(next) {
        for (const key of ["n", "L", "speed"]) if (next[key] != null) o[key] = next[key];
        drawStatic();
      },
      /** show({ wavelength: false }) removes the half-wavelength bracket and its number. */
      show(which) {
        if (which.wavelength != null) showWavelength = which.wavelength;
        drawStatic();
      },
      showValues(visible) {
        showWavelength = visible;
        drawStatic();
      },
      values: () => kit.physics.harmonic(n(), o.L, o.speed),
    };
  };
})();
