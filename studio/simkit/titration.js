/* simkit.titration: a burette of base above a flask of acid with indicator. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=260, y=40 (top of the burette), cAcid=0.1 (mol/L), vAcid=25 (mL in the flask), cBase=0.1 (mol/L),
   *         vBase=0 (mL added, 0–50), showValues=true (pH under the flask) }
   * The indicator (phenolphthalein) turns the flask pink above pH 8.2.
   * Returns { update({ cAcid, vAcid, cBase, vBase }), show({ pH }), showValues(bool), values() }
   * values() -> { pH, equivalence (mL) }   (see simkit.physics.titration)
   */
  kit.titration = function (stage, opts) {
    const o = Object.assign({ x: 260, y: 40, cAcid: 0.1, vAcid: 25, cBase: 0.1, vBase: 0, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-titration" });
    let showPH = o.showValues;
    const bw = 30;
    const bh = 250;
    const sol = () => kit.physics.titration(o.cAcid, o.vAcid, o.cBase, kit.clamp(o.vBase, 0, 50));
    // Burette with a scale from 0 mL (top) to 50 mL (bottom).
    const baseLiquid = kit.el("rect", { x: o.x - bw / 2 + 3, width: bw - 6, fill: kit.colors.blue, "fill-opacity": 0.35 }, g);
    kit.el("rect", { x: o.x - bw / 2, y: o.y, width: bw, height: bh, fill: "none", stroke: kit.colors.steel, "stroke-width": 3 }, g);
    kit.el("path", { d: `M ${o.x - bw / 2} ${o.y + bh} L ${o.x - 4} ${o.y + bh + 24} L ${o.x - 4} ${o.y + bh + 44} M ${o.x + bw / 2} ${o.y + bh} L ${o.x + 4} ${o.y + bh + 24} L ${o.x + 4} ${o.y + bh + 44}`, fill: "none", stroke: kit.colors.steel, "stroke-width": 3 }, g);
    for (let mL = 0; mL <= 50; mL += 10) {
      const y = o.y + 10 + (mL / 50) * (bh - 20);
      kit.el("line", { x1: o.x + bw / 2, y1: y, x2: o.x + bw / 2 + 10, y2: y, stroke: kit.colors.ink, "stroke-width": 2 }, g);
      kit.el("text", { x: o.x + bw / 2 + 16, y: y + 4, class: "simkit-tick", text: `${mL} mL` }, g);
    }
    kit.el("text", { x: o.x - bw / 2 - 14, y: o.y + 20, "text-anchor": "end", class: "simkit-label", fill: kit.colors.blueDark, text: "base" }, g);
    const addedLabel = kit.el("text", { x: o.x - bw / 2 - 14, y: o.y + 44, "text-anchor": "end", class: "simkit-tick" }, g);
    // Conical flask under the burette.
    const fy = o.y + bh + 50;
    const flask = `M ${o.x - 18} ${fy} L ${o.x - 18} ${fy + 40} L ${o.x - 90} ${fy + 160} Q ${o.x - 96} ${fy + 176} ${o.x - 78} ${fy + 176} L ${o.x + 78} ${fy + 176} Q ${o.x + 96} ${fy + 176} ${o.x + 90} ${fy + 160} L ${o.x + 18} ${fy + 40} L ${o.x + 18} ${fy}`;
    const clip = kit.el("clipPath", { id: stage.uid("flask") }, stage.defs);
    kit.el("path", { d: `${flask} Z` }, clip);
    const liquid = kit.el("rect", { x: o.x - 100, width: 200, "clip-path": `url(#${stage.uid("flask")})` }, g);
    kit.el("path", { d: flask, fill: "none", stroke: kit.colors.steel, "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" }, g);
    kit.el("text", { x: o.x - 110, y: fy + 150, "text-anchor": "end", class: "simkit-label", fill: kit.colors.redDark, text: "acid + indicator" }, g);
    const phLabel = kit.el("text", { x: o.x + 110, y: fy + 150, class: "simkit-label", fill: kit.colors.ink }, g);

    function draw() {
      const v = sol();
      const added = kit.clamp(o.vBase, 0, 50);
      const top = o.y + 10 + (added / 50) * (bh - 20);
      kit.set(baseLiquid, { y: top, height: o.y + bh - top });
      kit.set(addedLabel, { text: `added: ${kit.fmt(added, 1)} mL` });
      const depth = kit.clamp(40 + (o.vAcid + added) * 0.9, 40, 130);
      const pink = kit.clamp((v.pH - 8.2) / 1.5, 0, 1);
      kit.set(liquid, { y: fy + 176 - depth, height: depth, fill: pink > 0 ? "#e85aa8" : "#dceefb", "fill-opacity": pink > 0 ? 0.35 + 0.5 * pink : 0.8 });
      kit.set(phLabel, { text: showPH ? `pH ${kit.fmt(v.pH, 1)}` : "pH ?" });
    }

    draw();

    return {
      update(next) {
        for (const key of ["cAcid", "vAcid", "cBase", "vBase"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ pH: false }) writes "pH ?"; the flask's colour still shows when the end point is passed. */
      show(which) {
        if (which.pH != null) showPH = which.pH;
        draw();
      },
      showValues(visible) {
        showPH = visible;
        draw();
      },
      values: sol,
    };
  };
})();
