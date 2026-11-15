/* simkit.charges: two point charges with the electric force on each (Coulomb's law). */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500, y=300 (midpoint between the charges), pxPerM=500, q1=2, q2=-3 (µC), r=0.5 (m, 0.2 to 1.2),
   *         showValues=true, drag: { r: app.link("key") } (the student drags either charge sideways to change
   *         the distance; both move symmetrically about the midpoint) }
   * Returns { update({ q1, q2, r }), show({ q1, q2, r, force }), showValues(bool), values() }
   * values() -> { force (N), attract }   (see simkit.physics.coulomb). A hidden value reads "?"; hiding the
   * force also removes the arrows' lengths as a clue (they are drawn at a fixed length).
   */
  kit.charges = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 300, pxPerM: 500, q1: 2, q2: -3, r: 0.5, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-charges" });
    const shown = { q1: o.showValues, q2: o.showValues, r: o.showValues, force: o.showValues };
    const sol = () => kit.physics.coulomb(o.q1, o.q2, o.r);
    const R = 26;

    function draw() {
      g.textContent = "";
      const v = sol();
      const half = (kit.clamp(o.r, 0.2, 1.2) * o.pxPerM) / 2;
      const xs = [o.x - half, o.x + half];
      const link = o.drag && o.drag.r;
      [o.q1, o.q2].forEach((q, i) => {
        const color = q > 0 ? kit.colors.red : q < 0 ? kit.colors.blue : kit.colors.steel;
        const ball = kit.el("g", null, g);
        if (kit.linked(link)) kit.grip(ball, xs[i], o.y, R + 12);
        kit.el("circle", { cx: xs[i], cy: o.y, r: R, fill: color, stroke: kit.colors.ink, "stroke-width": 2 }, ball);
        kit.el("text", { x: xs[i], y: o.y + 9, "text-anchor": "middle", class: "simkit-label", style: "font-size: 26px", fill: "#fff", text: q > 0 ? "+" : q < 0 ? "−" : "" }, ball);
        kit.drag(stage, ball, link, (p, start, from) => link(from + ((i ? 1 : -1) * 2 * (p.x - start.x)) / o.pxPerM), () => o.r);
        const key = i ? "q2" : "q1";
        kit.el("text", { x: xs[i], y: o.y + R + 28, "text-anchor": "middle", class: "simkit-label", fill: color, text: shown[key] ? `${q > 0 ? "+" : ""}${kit.fmt(q, q % 1 ? 1 : 0)} µC` : "? µC" }, g);
      });
      // Distance bracket under the charges.
      const by = o.y + R + 58;
      kit.el("path", { d: `M ${xs[0]} ${by - 8} L ${xs[0]} ${by} L ${xs[1]} ${by} L ${xs[1]} ${by - 8}`, fill: "none", stroke: kit.colors.ink, "stroke-width": 2 }, g);
      kit.el("text", { x: o.x, y: by + 24, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: shown.r ? `r = ${kit.fmt(o.r, 2)} m` : "r = ?" }, g);
      // Force arrows above the charges: toward each other (attract) or apart (repel).
      if (v.force > 0) {
        const want = shown.force ? kit.clamp(40 * Math.log10(1 + v.force * 100), 24, 110) : 60;
        const len = v.attract ? Math.min(want, half - 8) : want;
        const ay = o.y - R - 22;
        const dir = v.attract ? 1 : -1;
        kit.arrowShape(g, xs[0], ay, xs[0] + dir * len, ay, { color: kit.colors.purple, width: 6, head: 14 });
        kit.arrowShape(g, xs[1], ay, xs[1] - dir * len, ay, { color: kit.colors.purple, width: 6, head: 14 });
        kit.el("text", { x: o.x, y: ay - 34, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.purple, text: shown.force ? `F = ${kit.fmt(v.force, v.force < 10 ? 2 : 1)} N on each charge` : "F = ?" }, g);
      }
    }

    draw();

    return {
      update(next) {
        for (const key of ["q1", "q2", "r"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** Show or hide single values, e.g. show({ force: false }) when a step asks for the force. */
      show(which) {
        for (const key of ["q1", "q2", "r", "force"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      showValues(visible) {
        shown.q1 = shown.q2 = shown.r = shown.force = visible;
        draw();
      },
      values: sol,
    };
  };
})();
