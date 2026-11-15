/* simkit.binarySearch: a sorted row of numbers being searched by halving. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500, y=250 (centre of the row), values=[sorted numbers] (up to 16), target, steps=0 (checks made
   *         so far), showValues=true (the counts of checks and of numbers still possible) }
   * Returns { update({ target, steps, values }), showValues(bool), values() }
   * values() -> { low, high, mid, found, checks, needed }   (see simkit.physics.binarySearch)
   */
  kit.binarySearch = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 250, values: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23, steps: 0, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-search" });
    const sol = () => kit.physics.binarySearch(o.values, o.target, o.steps);

    function draw() {
      g.textContent = "";
      const v = sol();
      const n = o.values.length;
      const size = Math.min(64, 860 / n - 8);
      const pitch = size + 8;
      const left = o.x - (n * pitch - 8) / 2;
      kit.el("text", { x: o.x, y: o.y - size / 2 - 70, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: kit.colors.ink, text: `looking for ${o.target}` }, g);
      o.values.forEach((value, i) => {
        const bx = left + i * pitch;
        const possible = i >= v.low && i <= v.high;
        const found = v.found === i;
        const next = v.mid === i;
        kit.el("rect", { x: bx, y: o.y - size / 2, width: size, height: size, rx: 8, fill: found ? kit.colors.green : next ? kit.colors.yellow : possible ? "#fff" : "#e3e5e3", stroke: found ? kit.colors.greenDark : next ? kit.colors.orange : kit.colors.steel, "stroke-width": found || next ? 4 : 2 }, g);
        kit.el("text", { x: bx + size / 2, y: o.y + 6, "text-anchor": "middle", class: "simkit-label", fill: possible ? (found ? "#fff" : kit.colors.ink) : kit.colors.muted, text: String(value) }, g);
        kit.el("text", { x: bx + size / 2, y: o.y + size / 2 + 20, "text-anchor": "middle", class: "simkit-tick", text: String(i) }, g);
        if (next) kit.el("text", { x: bx + size / 2, y: o.y - size / 2 - 14, "text-anchor": "middle", class: "simkit-tick", fill: kit.colors.orange, style: "font-weight: 600", text: "check next" }, g);
      });
      const done = v.mid == null;
      const status = v.found != null ? `found at position ${v.found}` : done ? "not in the list" : o.showValues ? `${v.high - v.low + 1} numbers still possible` : "searching";
      kit.el("text", { x: o.x, y: o.y + size / 2 + 66, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.showValues ? `${status} · checks: ${v.checks}` : status }, g);
    }

    draw();

    return {
      update(next) {
        if (next.values) o.values = next.values.slice(0, 16);
        if (next.target != null) o.target = next.target;
        if (next.steps != null) o.steps = next.steps;
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      values: sol,
    };
  };
})();
