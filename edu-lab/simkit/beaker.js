/* simkit.beaker: a beaker of solution; colour and particle density follow the concentration (or the pH). */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=360, y=110, w=280, h=340, volume=250 (mL), vMax=500 (mL when full), moles=0.1 (solute),
   *         cMax=1 (mol/L drawn at full colour), color=simkit blue, pH (optional: colours the liquid like
   *         universal indicator instead), label="" (name under the beaker), showValues=true }
   * Returns { update({ volume, moles, pH, label }), showValues(bool), concentration() }   mol/L
   */
  kit.beaker = function (stage, opts) {
    const o = Object.assign({ x: 360, y: 110, w: 280, h: 340, volume: 250, vMax: 500, moles: 0.1, cMax: 1, color: kit.colors.blue, pH: null, label: "", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-beaker" });
    const inner = { x: o.x + 8, w: o.w - 16, bottom: o.y + o.h - 8, top: o.y + 30 };
    const liquid = kit.el("rect", { x: inner.x, width: inner.w, rx: 6 }, g);
    const dotsG = kit.el("g", null, g);
    kit.el("path", { d: `M ${o.x - 10} ${o.y} L ${o.x} ${o.y + 10} L ${o.x} ${o.y + o.h - 14} Q ${o.x} ${o.y + o.h} ${o.x + 14} ${o.y + o.h} L ${o.x + o.w - 14} ${o.y + o.h} Q ${o.x + o.w} ${o.y + o.h} ${o.x + o.w} ${o.y + o.h - 14} L ${o.x + o.w} ${o.y + 10} L ${o.x + o.w + 10} ${o.y}`, fill: "none", stroke: kit.colors.steel, "stroke-width": 6, "stroke-linejoin": "round", "stroke-linecap": "round" }, g);
    // Volume marks on the left wall.
    for (let i = 1; i <= 4; i++) {
      const y = inner.bottom - ((inner.bottom - inner.top) * i) / 4;
      kit.el("line", { x1: o.x + 6, y1: y, x2: o.x + 26, y2: y, stroke: kit.colors.steel, "stroke-width": 2 }, g);
      kit.el("text", { x: o.x - 12, y: y + 4, "text-anchor": "end", class: "simkit-tick", text: `${Math.round((o.vMax * i) / 4)} mL` }, g);
    }
    const name = kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 32, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink }, g);
    const value = kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 54, "text-anchor": "middle", class: "simkit-tick" }, g);

    // Fixed pseudo-random spots, so the picture does not jump when a slider moves.
    const spots = Array.from({ length: 140 }, (_, i) => [(0.5 + i * 0.7548776662) % 1, (0.5 + i * 0.569840291) % 1]); // evenly scattered
    const conc = () => kit.physics.molarity(o.moles, o.volume);
    // Universal indicator: red (acid) → green (neutral) → purple (base).
    const phColor = (pH) => `hsl(${Math.round(kit.clamp(pH, 0, 14) * 20)}, 70%, 55%)`;

    function draw() {
      const level = kit.clamp(o.volume / o.vMax, 0, 1) * (inner.bottom - inner.top);
      const c = conc();
      const usePH = o.pH != null;
      kit.set(liquid, { y: inner.bottom - level, height: level, fill: usePH ? phColor(o.pH) : o.color, "fill-opacity": usePH ? 0.6 : kit.clamp(0.08 + 0.62 * (c / o.cMax), 0.08, 0.7) });
      dotsG.textContent = "";
      // One dot per 2 mmol of solute, spread through the liquid: denser means more concentrated.
      const count = usePH ? 0 : kit.clamp(Math.round(o.moles * 500), 0, spots.length);
      for (let i = 0; i < count && level > 16; i++) {
        kit.el("circle", { cx: inner.x + 10 + spots[i][0] * (inner.w - 20), cy: inner.bottom - 8 - spots[i][1] * (level - 16), r: 4, fill: o.color, stroke: "#fff", "stroke-width": 1 }, dotsG);
      }
      kit.set(name, { text: o.label });
      kit.set(value, { text: !o.showValues ? "" : usePH ? `pH ${kit.fmt(o.pH, 1)}` : `${kit.fmt(o.volume, 0)} mL · ${kit.fmt(c, 2)} mol/L` });
    }

    draw();

    return {
      update(next) {
        for (const k of ["volume", "moles", "label", "color"]) if (next[k] != null) o[k] = next[k];
        if ("pH" in next) o.pH = next.pH;
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      concentration: conc,
    };
  };
})();
