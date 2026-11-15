/* simkit.equationBalance: a chemical equation with adjustable coefficients, drawn as molecules and atom counts. */
(function () {
  "use strict";
  const kit = window.simkit;

  const atomColor = { H: "#ffffff", O: "#e8735f", N: "#4a7fe0", C: "#4b5157", Fe: "#f08c2e", Mg: "#2fa57a" };

  /**
   * opts: { x=110, y=110 (top-left), w=780, reaction="water" ("water" H₂ + O₂ → H₂O, "ammonia" N₂ + H₂ → NH₃,
   *         "methane" CH₄ + O₂ → CO₂ + H₂O, "rust" Fe + O₂ → Fe₂O₃, "magnesium" Mg + O₂ → MgO),
   *         coefficients=[1, 1, 1] (one per species, left side first; 1–6), showCounts=true (atom counts per side) }
   * Returns { update({ coefficients, reaction }), showCounts(bool), values() }
   * values() -> { left: { element: atoms }, right: { … }, balanced }   (see simkit.physics.balance)
   */
  kit.equationBalance = function (stage, opts) {
    const o = Object.assign({ x: 110, y: 110, w: 780, reaction: "water", coefficients: [1, 1, 1], showCounts: true }, opts);
    const g = stage.layer({ class: "simkit-balance" });
    const sol = () => kit.physics.balance(o.reaction, o.coefficients);

    function molecule(parent, cx, cy, atoms) {
      const list = [];
      for (const el in atoms) for (let i = 0; i < atoms[el]; i++) list.push(el);
      const r = 10;
      const step = 15;
      list.forEach((el, i) => kit.el("circle", { cx: cx + (i - (list.length - 1) / 2) * step, cy, r, fill: atomColor[el] || kit.colors.steel, stroke: kit.colors.ink, "stroke-width": 1.5 }, parent));
    }

    function draw() {
      g.textContent = "";
      const r = kit.physics.reactions[o.reaction] || kit.physics.reactions.water;
      const species = [...r.left.map((s) => ({ s, side: "left" })), ...r.right.map((s) => ({ s, side: "right" }))];
      const colW = o.w / species.length;
      const big = "font-size: 28px";
      species.forEach(({ s }, i) => {
        const cx = o.x + colW * (i + 0.5);
        const k = kit.clamp(Math.round(o.coefficients[i] || 0), 0, 6);
        kit.el("text", { x: cx, y: o.y + 30, "text-anchor": "middle", class: "simkit-label", style: big, fill: kit.colors.ink, text: `${k} ${s[0]}` }, g);
        for (let j = 0; j < k; j++) molecule(g, cx, o.y + 70 + j * 30, s[1]);
        // "+" between species on the same side, "→" between the two sides.
        if (i < species.length - 1) kit.el("text", { x: o.x + colW * (i + 1), y: o.y + 30, "text-anchor": "middle", class: "simkit-label", style: big, fill: kit.colors.muted, text: i === r.left.length - 1 ? "→" : "+" }, g);
      });
      const split = o.x + colW * r.left.length;
      kit.el("line", { x1: split, y1: o.y + 56, x2: split, y2: o.y + 250, stroke: kit.colors.line, "stroke-width": 2, "stroke-dasharray": "6 6" }, g);
      if (!o.showCounts) return;
      // Atom counts per element under each side.
      const v = sol();
      const elements = Object.keys(v.left);
      elements.forEach((el, i) => {
        const y = o.y + 290 + i * 30;
        const same = v.left[el] === v.right[el];
        const color = same ? kit.colors.greenDark : kit.colors.redDark;
        kit.el("circle", { cx: split, cy: y - 6, r: 10, fill: atomColor[el] || kit.colors.steel, stroke: kit.colors.ink, "stroke-width": 1.5 }, g);
        kit.el("text", { x: split - 26, y, "text-anchor": "end", class: "simkit-label", fill: color, text: `${v.left[el] || 0} ${el} atoms` }, g);
        kit.el("text", { x: split + 26, y, class: "simkit-label", fill: color, text: `${v.right[el] || 0} ${el} atoms` }, g);
      });
    }

    draw();

    return {
      update(next) {
        if (next.reaction != null) o.reaction = next.reaction;
        if (next.coefficients) o.coefficients = next.coefficients.slice();
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
