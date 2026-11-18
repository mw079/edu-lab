/* simkit.cellParts: a plant or an animal cell with its parts; click a part to see what it does. */
(function () {
  "use strict";
  const kit = window.simkit;
  const LOOK = [
    { fill: "#c9b6ec", stroke: kit.colors.purple }, // nucleus
    { fill: "none", stroke: "#5f6872" }, // membrane
    { fill: "#fbf3df", stroke: "#d8c9a3" }, // cytoplasm
    { fill: "#f6b98a", stroke: "#a85a12" }, // mitochondria
    { fill: "#646d67", stroke: "#646d67" }, // ribosomes
    { fill: "none", stroke: kit.colors.greenDark }, // cell wall
    { fill: "#7cc58f", stroke: kit.colors.greenDark }, // chloroplasts
    { fill: "#d7e7fb", stroke: kit.colors.blueDark }, // vacuole
  ];

  /**
   * opts: { x=40, y=30 (top left), kind=1 (1 = plant cell, 0 = animal cell), part=-1 (highlighted part 0–7, −1 = none),
   *         showNames=true, click: { part: app.link("key") } (the student clicks a part in the picture or in the list) }
   * Parts (simkit.physics.cellParts): 0 nucleus, 1 cell membrane, 2 cytoplasm, 3 mitochondria, 4 ribosomes,
   * 5 cell wall, 6 chloroplasts, 7 permanent vacuole (5–7 only in plant cells).
   * Returns { update({ kind, part }), show({ names }), values() }
   * values() -> { name, job, plant, animal, present, partsInCell }   (see simkit.physics.cellPart)
   */
  kit.cellParts = function (stage, opts) {
    const o = Object.assign({ x: 40, y: 30, kind: 1, part: -1, showNames: true }, opts);
    const g = stage.layer({ class: "simkit-cell" });
    const pick = o.click && o.click.part;
    const sol = () => kit.physics.cellPart(o.part < 0 ? 0 : o.part, o.kind);

    function draw() {
      g.textContent = "";
      const plant = Boolean(o.kind);
      const chosen = Math.round(o.part);
      const part = (i) => {
        const pg = kit.el("g", null, g);
        kit.click(pg, pick, () => pick(i));
        return pg;
      };
      const look = (i, extra) => Object.assign({ fill: LOOK[i].fill, stroke: chosen === i ? "#e0a400" : LOOK[i].stroke, "stroke-width": chosen === i ? 5 : 2 }, extra);
      const cx = o.x + 240;
      const cy = o.y + 230;
      // Cytoplasm (the inside), then the parts on top of it.
      const inside = plant ? { x: cx - 205, y: cy - 145, width: 410, height: 290, rx: 18 } : { cx, cy, rx: 210, ry: 150 };
      kit.el(plant ? "rect" : "ellipse", look(2, Object.assign({}, inside, { "stroke-width": chosen === 2 ? 5 : 0 })), part(2));
      if (plant) kit.el("rect", look(7, { x: cx - 20, y: cy - 95, width: 190, height: 190, rx: 40 }), part(7));
      const nx = plant ? cx - 120 : cx - 40;
      const nucleus = part(0);
      kit.el("circle", look(0, { cx: nx, cy: cy - 10, r: 42 }), nucleus);
      kit.el("circle", { cx: nx + 8, cy: cy - 14, r: 12, fill: kit.colors.purple, "fill-opacity": 0.5 }, nucleus);
      const mito = part(3);
      const mitoAt = plant ? [[cx - 150, cy + 85], [cx - 50, cy + 110], [cx - 160, cy - 100]] : [[cx + 90, cy - 70], [cx + 110, cy + 60], [cx - 120, cy + 70], [cx - 140, cy - 60]];
      for (const [mx, my] of mitoAt) {
        kit.el("ellipse", look(3, { cx: mx, cy: my, rx: 26, ry: 13 }), mito);
        kit.el("path", { d: `M ${mx - 18} ${my} q 6 -9 12 0 t 12 0 t 12 0`, fill: "none", stroke: "#a85a12", "stroke-width": 1.5 }, mito);
      }
      if (plant) {
        const chloro = part(6);
        for (const [hx, hy] of [[cx - 70, cy - 115], [cx + 70, cy - 120], [cx + 150, cy + 122], [cx + 60, cy + 122], [cx - 100, cy + 60], [cx - 180, cy + 20]])
          kit.el("ellipse", look(6, { cx: hx, cy: hy, rx: 22, ry: 12 }), chloro);
      }
      // Ribosomes: small dots spread through the cytoplasm (never inside the vacuole or the nucleus).
      const ribo = part(4);
      let seed = 5;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      for (let k = 0, placed = 0; placed < 18 && k < 400; k++) {
        const px = cx - 190 + rnd() * 380;
        const py = cy - 130 + rnd() * 260;
        const inVacuole = plant && px > cx - 30 && px < cx + 180 && py > cy - 105 && py < cy + 105;
        const inNucleus = Math.hypot(px - nx, py - (cy - 10)) < 50;
        const outside = plant ? Math.abs(px - cx) > 190 || Math.abs(py - cy) > 130 : ((px - cx) / 195) ** 2 + ((py - cy) / 135) ** 2 > 1;
        if (inVacuole || inNucleus || outside) continue;
        kit.el("circle", { cx: px, cy: py, r: chosen === 4 ? 5 : 3.5, fill: chosen === 4 ? "#e0a400" : LOOK[4].fill }, ribo);
        placed++;
      }
      // Membrane (and the wall around it for a plant cell).
      const edge = plant ? { x: cx - 205, y: cy - 145, width: 410, height: 290, rx: 18 } : { cx, cy, rx: 210, ry: 150 };
      kit.el(plant ? "rect" : "ellipse", look(1, Object.assign({}, edge, { fill: "none", "stroke-width": chosen === 1 ? 5 : 3 })), part(1));
      if (plant) kit.el("rect", look(5, { x: cx - 220, y: cy - 160, width: 440, height: 320, rx: 24, fill: "none", "stroke-width": chosen === 5 ? 9 : 7 }), part(5));
      kit.el("text", { x: cx, y: cy + 196, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: plant ? "plant cell" : "animal cell" }, g);
      // The list of parts at the right.
      const lx = o.x + 520;
      kit.physics.cellParts.forEach((p, i) => {
        const ly = o.y + 60 + i * 44;
        const has = plant ? p.plant : p.animal;
        const row = kit.el("g", null, g);
        if (chosen === i) kit.el("rect", { x: lx - 10, y: ly - 22, width: 330, height: 34, rx: 8, fill: kit.colors.yellow, "fill-opacity": 0.4 }, row);
        else kit.el("rect", { x: lx - 10, y: ly - 22, width: 330, height: 34, rx: 8, fill: "#fff", "fill-opacity": 0.01 }, row);
        kit.el("rect", { x: lx, y: ly - 14, width: 18, height: 18, rx: 4, fill: LOOK[i].fill === "none" ? "#fff" : LOOK[i].fill, stroke: LOOK[i].stroke, "stroke-width": 2 }, row);
        kit.el("text", { x: lx + 30, y: ly, class: "simkit-label", fill: has ? kit.colors.ink : kit.colors.muted, text: o.showNames ? p.name : `part ${i + 1}` }, row);
        if (!has) kit.el("text", { x: lx + 210, y: ly, class: "simkit-tick", text: "plant cells only" }, row);
        if (has) kit.click(row, pick, () => pick(i));
      });
      const info = chosen >= 0 && chosen <= 7 ? kit.physics.cellParts[chosen] : null;
      kit.el("text", { x: o.x + 20, y: o.y + 490, class: "simkit-label", fill: kit.colors.ink, text: info ? `${o.showNames ? info.name : "This part"}: ${info.job}` : "Click a part to see what it does." }, g);
    }

    draw();

    return {
      update(next) {
        for (const key of ["kind", "part"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ names: false }) writes "part 1"… in the list and "This part: …" below (to ask which part does a job). */
      show(which) {
        if (which.names != null) o.showNames = which.names;
        draw();
      },
      values: sol,
    };
  };
})();
