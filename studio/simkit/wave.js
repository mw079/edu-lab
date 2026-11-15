/* simkit.wave: a travelling wave on a string with its wavelength and amplitude marked. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=100, y=250 (left end of the rest line), w=800, pxPerM=100, amplitude=0.5 (m, up to 1.2),
   *         wavelength=2 (m), frequency=1 (Hz), showValues=true }
   * The wave always moves to the right at speed = frequency × wavelength (real time).
   * Returns { update({ amplitude, wavelength, frequency }), show({ wavelength, amplitude }), showValues(bool), values() }
   * values() -> { speed (m/s), period (s) }
   */
  kit.wave = function (stage, opts) {
    const o = Object.assign({ x: 100, y: 250, w: 800, pxPerM: 100, amplitude: 0.5, wavelength: 2, frequency: 1, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-wave" });
    const shown = { wavelength: o.showValues, amplitude: o.showValues };
    const metres = o.w / o.pxPerM;
    const rulerY = o.y + 200;
    kit.el("line", { x1: o.x, y1: o.y, x2: o.x + o.w, y2: o.y, stroke: kit.colors.line, "stroke-width": 2, "stroke-dasharray": "8 6" }, g);
    kit.el("line", { x1: o.x, y1: rulerY, x2: o.x + o.w, y2: rulerY, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    for (let m = 0; m <= metres + 1e-9; m++) {
      kit.el("line", { x1: o.x + m * o.pxPerM, y1: rulerY, x2: o.x + m * o.pxPerM, y2: rulerY + 10, stroke: kit.colors.ink, "stroke-width": 2 }, g);
      kit.el("text", { x: o.x + m * o.pxPerM, y: rulerY + 28, "text-anchor": "middle", class: "simkit-tick", text: `${m} m` }, g);
    }
    const ampLine = kit.el("line", { x1: o.x, x2: o.x + o.w, stroke: kit.colors.orange, "stroke-width": 2, "stroke-dasharray": "4 6" }, g);
    const ampLabel = kit.el("text", { x: o.x, class: "simkit-label", fill: kit.colors.orange }, g);
    const path = kit.el("path", { fill: "none", stroke: kit.colors.blue, "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    const bracket = kit.el("path", { fill: "none", stroke: kit.colors.purple, "stroke-width": 3 }, g);
    const lamLabel = kit.el("text", { "text-anchor": "middle", class: "simkit-label", fill: kit.colors.purple }, g);
    const bead = kit.el("circle", { cx: o.x + o.w / 2, r: 9, fill: kit.colors.red, stroke: "#fff", "stroke-width": 2 }, g);
    let time = 0;

    function draw() {
      const A = kit.clamp(o.amplitude, 0, 1.2) * o.pxPerM;
      const lam = Math.max(0.2, o.wavelength);
      const k = (2 * Math.PI) / lam;
      const phase = 2 * Math.PI * o.frequency * time;
      const Y = (xm) => o.y - A * Math.sin(k * xm - phase);
      let d = "";
      for (let px = 0; px <= o.w; px += 4) d += `${px ? "L" : "M"} ${o.x + px} ${Y(px / o.pxPerM).toFixed(1)} `;
      kit.set(path, { d });
      kit.set(bead, { cy: Y(metres / 2).toFixed(1) });
      kit.set(ampLine, { y1: o.y - A, y2: o.y - A, opacity: shown.amplitude && A > 0 ? 1 : 0 });
      kit.set(ampLabel, { y: o.y - A - 12, text: shown.amplitude ? `amplitude ${kit.fmt(o.amplitude, 2)} m` : "" });
      // The bracket follows one trough-to-trough stretch of the wave.
      const first = ((((phase - Math.PI / 2) / k) % lam) + lam) % lam; // first trough at or after x = 0
      const fits = first + lam <= metres + 1e-9;
      const by = o.y + A + 22;
      const x1 = o.x + first * o.pxPerM;
      const x2 = x1 + lam * o.pxPerM;
      kit.set(bracket, { d: shown.wavelength && fits ? `M ${x1.toFixed(1)} ${by - 8} L ${x1.toFixed(1)} ${by} L ${x2.toFixed(1)} ${by} L ${x2.toFixed(1)} ${by - 8}` : "" });
      kit.set(lamLabel, { x: ((x1 + x2) / 2).toFixed(1), y: by + 24, text: shown.wavelength && fits ? `wavelength ${kit.fmt(lam, 2)} m` : "" });
    }

    stage.onFrame((dt) => {
      time += dt;
      draw();
    });
    draw();

    return {
      update(next) {
        for (const key of ["amplitude", "wavelength", "frequency"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** Show or hide single labels, e.g. show({ wavelength: false }) when a step asks for the wavelength. */
      show(which) {
        if (which.wavelength != null) shown.wavelength = which.wavelength;
        if (which.amplitude != null) shown.amplitude = which.amplitude;
        draw();
      },
      showValues(visible) {
        shown.wavelength = shown.amplitude = visible;
        draw();
      },
      values: () => ({ speed: o.frequency * o.wavelength, period: 1 / o.frequency }),
    };
  };
})();
