/* simkit.punnett: Punnett square for one gene with two alleles. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=330, y=130 (top-left of the 2 × 2 grid), size=320, parent1=1, parent2=1 (number of dominant
   *         alleles: 2 = AA, 1 = Aa, 0 = aa; or the genotype as text, "Aa"), letter="A", dominantColor=simkit purple, recessiveColor="#fff",
   *         showOffspring=true (the four boxes) }
   * Returns { update({ parent1, parent2 }), showOffspring(bool), values() }
   * values() -> { cells, AA, Aa, aa, dominant }   (see simkit.physics.punnett)
   */
  kit.punnett = function (stage, opts) {
    const o = Object.assign({ x: 330, y: 130, size: 320, parent1: 1, parent2: 1, letter: "A", dominantColor: kit.colors.purple, recessiveColor: "#fff", showOffspring: true }, opts);
    const g = stage.layer({ class: "simkit-punnett" });
    const cell = o.size / 2;
    const sol = () => kit.physics.punnett(o.parent1, o.parent2, o.letter);
    const big = "font-size: 26px";

    function flower(parent, cx, cy, dominant) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 2 * Math.PI - Math.PI / 2;
        kit.el("circle", { cx: cx + 13 * Math.cos(a), cy: cy + 13 * Math.sin(a), r: 10, fill: dominant ? o.dominantColor : o.recessiveColor, stroke: kit.colors.ink, "stroke-width": 1.5 }, parent);
      }
      kit.el("circle", { cx, cy, r: 7, fill: kit.colors.yellow, stroke: kit.colors.ink, "stroke-width": 1.5 }, parent);
    }

    function draw() {
      g.textContent = "";
      const v = sol();
      const L = o.letter;
      kit.el("text", { x: o.x + o.size / 2, y: o.y - 66, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `Parent 1: ${v.top.join("")}` }, g);
      kit.el("text", { x: o.x - 76, y: o.y + o.size / 2 + 5, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink, text: `Parent 2: ${v.side.join("")}` }, g);
      for (let i = 0; i < 2; i++) {
        kit.el("text", { x: o.x + cell * (i + 0.5), y: o.y - 18, "text-anchor": "middle", class: "simkit-label", style: big, fill: kit.colors.blueDark, text: v.top[i] }, g);
        kit.el("text", { x: o.x - 30, y: o.y + cell * (i + 0.5) + 9, "text-anchor": "middle", class: "simkit-label", style: big, fill: kit.colors.redDark, text: v.side[i] }, g);
      }
      v.cells.forEach((geno, i) => {
        const cx = o.x + cell * ((i % 2) + 0.5);
        const cy = o.y + cell * (Math.floor(i / 2) + 0.5);
        kit.el("rect", { x: cx - cell / 2, y: cy - cell / 2, width: cell, height: cell, fill: "#fff", stroke: kit.colors.ink, "stroke-width": 2 }, g);
        if (!o.showOffspring) {
          kit.el("text", { x: cx, y: cy + 10, "text-anchor": "middle", class: "simkit-label", style: big, fill: kit.colors.muted, text: "?" }, g);
          return;
        }
        flower(g, cx, cy - 22, geno.includes(L));
        kit.el("text", { x: cx, y: cy + 46, "text-anchor": "middle", class: "simkit-label", style: big, fill: kit.colors.ink, text: geno }, g);
      });
    }

    draw();

    return {
      update(next) {
        if (next.parent1 != null) o.parent1 = next.parent1;
        if (next.parent2 != null) o.parent2 = next.parent2;
        draw();
      },
      showOffspring(visible) {
        o.showOffspring = visible;
        draw();
      },
      values: sol,
    };
  };
})();
