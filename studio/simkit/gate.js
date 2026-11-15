/* simkit.logicGate: one logic gate with its inputs, output lamp and truth table. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=330, y=270 (centre of the gate), type="AND" ("AND", "OR", "XOR", "NAND", "NOR", "NOT"), a=0, b=0,
   *         showOutput=true (lamp and the table's output column), showTable=true }
   * Returns { update({ type, a, b }), show({ output, table }), values() }   values() -> { out }
   */
  kit.logicGate = function (stage, opts) {
    const o = Object.assign({ x: 330, y: 270, type: "AND", a: 0, b: 0, showOutput: true, showTable: true }, opts);
    const g = stage.layer({ class: "simkit-gate" });
    const on = kit.colors.green;
    const off = kit.colors.steel;
    const sol = () => ({ out: kit.physics.gate(o.type, o.a, o.b) });

    function draw() {
      g.textContent = "";
      const type = String(o.type).toUpperCase();
      const single = type === "NOT";
      const A = o.a ? 1 : 0;
      const B = o.b ? 1 : 0;
      const out = sol().out;
      const wire = (x1, y1, x2, y2, live) => kit.el("line", { x1, y1, x2, y2, stroke: live ? on : off, "stroke-width": 5, "stroke-linecap": "round" }, g);
      const inputs = single ? [[A, 0, "A"]] : [[A, -36, "A"], [B, 36, "B"]];
      inputs.forEach(([bit, dy, name]) => {
        wire(o.x - 190, o.y + dy, o.x - 56, o.y + dy, bit);
        kit.el("circle", { cx: o.x - 206, cy: o.y + dy, r: 20, fill: bit ? on : "#fff", stroke: kit.colors.ink, "stroke-width": 2 }, g);
        kit.el("text", { x: o.x - 206, y: o.y + dy + 6, "text-anchor": "middle", class: "simkit-label", fill: bit ? "#fff" : kit.colors.ink, text: String(bit) }, g);
        kit.el("text", { x: o.x - 240, y: o.y + dy + 6, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink, text: name }, g);
      });
      const live = o.showOutput && out;
      wire(o.x + 70, o.y, o.x + 170, o.y, live);
      // Gate body: a plain rounded shape with the gate's name, so no symbol has to be known beforehand.
      kit.el("path", { d: `M ${o.x - 60} ${o.y - 70} L ${o.x} ${o.y - 70} A 70 70 0 0 1 ${o.x} ${o.y + 70} L ${o.x - 60} ${o.y + 70} Z`, fill: "#e4edfb", stroke: kit.colors.blueDark, "stroke-width": 3, "stroke-linejoin": "round" }, g);
      kit.el("text", { x: o.x - 2, y: o.y + 8, "text-anchor": "middle", class: "simkit-label", style: "font-size: 22px", fill: kit.colors.blueDark, text: type }, g);
      // Output lamp.
      kit.el("circle", { cx: o.x + 196, cy: o.y, r: 26, fill: !o.showOutput ? "#fff" : out ? kit.colors.yellow : "#d5d9dc", stroke: kit.colors.ink, "stroke-width": 2 }, g);
      kit.el("text", { x: o.x + 196, y: o.y + 7, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: kit.colors.ink, text: o.showOutput ? String(out) : "?" }, g);
      kit.el("text", { x: o.x + 196, y: o.y + 54, "text-anchor": "middle", class: "simkit-tick", text: "output" }, g);
      if (!o.showTable) return;
      // Truth table at the right; the row for the current inputs is highlighted.
      const tx = o.x + 330;
      const rows = single ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      const heads = single ? ["A", "out"] : ["A", "B", "out"];
      const colW = 56;
      const top = o.y - ((rows.length + 1) * 36) / 2;
      heads.forEach((h, c) => kit.el("text", { x: tx + c * colW, y: top + 6, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: h }, g));
      kit.el("line", { x1: tx - 30, y1: top + 18, x2: tx + (heads.length - 1) * colW + 30, y2: top + 18, stroke: kit.colors.ink, "stroke-width": 2 }, g);
      rows.forEach((row, r) => {
        const y = top + 44 + r * 36;
        const current = row[0] === A && (single || row[1] === B);
        if (current) kit.el("rect", { x: tx - 30, y: y - 22, width: (heads.length - 1) * colW + 60, height: 32, rx: 6, fill: kit.colors.yellow, "fill-opacity": 0.45 }, g);
        const result = kit.physics.gate(type, row[0], row[1]);
        [...row, o.showOutput ? result : "?"].forEach((cell, c) => kit.el("text", { x: tx + c * colW, y, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: String(cell) }, g));
      });
    }

    draw();

    return {
      update(next) {
        for (const key of ["type", "a", "b"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ output: false }) blanks the lamp and the table's output column; show({ table: false }) removes the table. */
      show(which) {
        if (which.output != null) o.showOutput = which.output;
        if (which.table != null) o.showTable = which.table;
        draw();
      },
      values: sol,
    };
  };
})();
