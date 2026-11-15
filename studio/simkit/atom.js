/* simkit.atom: shell model of an atom or ion (elements 1–20). */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=380, y=280 (centre), protons=6, neutrons=6, electrons=6, showName=true (element name, symbol,
   *         mass number and charge at the right), showCounts=true (p and n in the nucleus) }
   * Returns { update({ protons, neutrons, electrons }), showName(bool), showCounts(bool), values() }
   * values() -> { symbol, name, shells, massNumber, charge }
   */
  kit.atom = function (stage, opts) {
    const o = Object.assign({ x: 380, y: 280, protons: 6, neutrons: 6, electrons: 6, showName: true, showCounts: true }, opts);
    const g = stage.layer({ class: "simkit-atom" });
    const shellsG = kit.el("g", null, g);
    kit.el("circle", { cx: o.x, cy: o.y, r: 38, fill: kit.colors.red, opacity: 0.9 }, g);
    const nucleus = [0, 1].map((i) => kit.el("text", { x: o.x, y: o.y - 4 + i * 20, "text-anchor": "middle", class: "simkit-label", fill: "#fff" }, g));
    const info = [0, 1, 2].map((i) => kit.el("text", { x: o.x + 250, y: o.y - 30 + i * 30, class: i === 0 ? "simkit-label" : "simkit-tick", fill: kit.colors.ink }, g));
    kit.set(info[0], { style: "font-size: 26px" });

    const sol = () => {
      const el = kit.physics.element(o.protons, o.electrons);
      return { symbol: el.symbol, name: el.name, shells: el.shells, massNumber: o.protons + o.neutrons, charge: o.protons - o.electrons };
    };

    function draw() {
      const v = sol();
      shellsG.textContent = "";
      v.shells.forEach((n, s) => {
        const r = 72 + s * 44;
        kit.el("circle", { cx: o.x, cy: o.y, r, fill: "none", stroke: kit.colors.line, "stroke-width": 2 }, shellsG);
        for (let i = 0; i < n; i++) {
          const a = (2 * Math.PI * i) / n - Math.PI / 2;
          kit.el("circle", { cx: o.x + r * Math.cos(a), cy: o.y + r * Math.sin(a), r: 8, fill: kit.colors.blue, stroke: "#fff", "stroke-width": 2 }, shellsG);
        }
      });
      kit.set(nucleus[0], { text: o.showCounts ? `${o.protons} p⁺` : "" });
      kit.set(nucleus[1], { text: o.showCounts ? `${o.neutrons} n` : "" });
      const sign = v.charge === 0 ? "" : `${Math.abs(v.charge) > 1 ? Math.abs(v.charge) : ""}${v.charge > 0 ? "+" : "−"}`;
      kit.set(info[0], { text: o.showName ? `${v.symbol}${sign ? " " + sign : ""}` : "" });
      kit.set(info[1], { text: o.showName ? `${v.name}-${v.massNumber}` : "" });
      kit.set(info[2], { text: o.showName ? (v.charge === 0 ? "neutral atom" : `ion, charge ${v.charge > 0 ? "+" : "−"}${Math.abs(v.charge)}`) : "" });
    }

    draw();

    return {
      update(next) {
        for (const k of ["protons", "neutrons", "electrons"]) if (next[k] != null) o[k] = kit.clamp(Math.round(next[k]), k === "protons" ? 1 : 0, 20);
        draw();
      },
      showName(visible) {
        o.showName = visible;
        draw();
      },
      showCounts(visible) {
        o.showCounts = visible;
        draw();
      },
      values: sol,
    };
  };
})();
