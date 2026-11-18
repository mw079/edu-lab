/* simkit.periodicTable: elements 1–20 in their groups and periods, with trends and one element in detail. */
(function () {
  "use strict";
  const kit = window.simkit;
  const KIND = { metal: "#fde3c8", metalloid: "#f8efbd", "non-metal": "#d9f0dc", "noble gas": "#e6dcf7" };
  const TREND = {
    radius: { label: "atomic radius", unit: "pm", key: "radius" },
    electronegativity: { label: "electronegativity", unit: "", key: "electronegativity" },
    ionization: { label: "first ionisation energy", unit: "kJ/mol", key: "ionization" },
  };

  /**
   * opts: { x=40, y=30 (top left), z=6 (the selected element, 1–20),
   *         trend="none" ("radius", "electronegativity" or "ionization": cells shaded light → dark from smallest to largest),
   *         showValues=true, click: { z: app.link("key") } (the student clicks an element to select it) }
   * Below the table: the selected element's card, its electron shells and its values.
   * Returns { update({ z, trend }), show({ values }), values() }
   * values() -> { z, symbol, name, group, period, valence, shells, radius (pm), electronegativity, ionization (kJ/mol),
   *               kind }   (see simkit.physics.periodic)
   */
  kit.periodicTable = function (stage, opts) {
    const o = Object.assign({ x: 40, y: 30, z: 6, trend: "none", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-periodic" });
    const pick = o.click && o.click.z;
    const all = Array.from({ length: 20 }, (_, i) => kit.physics.periodic(i + 1));
    const sol = () => kit.physics.periodic(o.z);
    const cellX = (group) => o.x + 30 + (group - 1) * 50;
    const cellY = (period) => o.y + 26 + (period - 1) * 54;

    function shade(el) {
      const t = TREND[o.trend];
      if (!t) return { fill: KIND[el.kind], dark: false };
      const v = el[t.key];
      if (v == null) return { fill: "#ececec", dark: false };
      const vals = all.map((e) => e[t.key]).filter((x) => x != null);
      const f = (v - Math.min(...vals)) / (Math.max(...vals) - Math.min(...vals));
      return { fill: `rgba(74, 127, 224, ${(0.08 + 0.72 * f).toFixed(2)})`, dark: f > 0.62 };
    }

    function draw() {
      g.textContent = "";
      const s = sol();
      for (let c = 1; c <= 18; c++) kit.el("text", { x: cellX(c) + 23, y: o.y + 16, "text-anchor": "middle", class: "simkit-tick", text: String(c) }, g);
      for (let p = 1; p <= 4; p++) kit.el("text", { x: o.x + 12, y: cellY(p) + 31, "text-anchor": "middle", class: "simkit-tick", text: String(p) }, g);
      for (const el of all) {
        const cx = cellX(el.group);
        const cy = cellY(el.period);
        const cell = kit.el("g", null, g);
        const sh = shade(el);
        const chosen = el.z === s.z;
        kit.el("rect", { x: cx, y: cy, width: 46, height: 50, rx: 5, fill: sh.fill, stroke: chosen ? kit.colors.ink : kit.colors.line, "stroke-width": chosen ? 3 : 1 }, cell);
        kit.el("text", { x: cx + 5, y: cy + 15, class: "simkit-tick", style: "font-size:12px", fill: sh.dark ? "#fff" : kit.colors.muted, text: String(el.z) }, cell);
        kit.el("text", { x: cx + 23, y: cy + 40, "text-anchor": "middle", class: "simkit-label", fill: sh.dark ? "#fff" : kit.colors.ink, text: el.symbol }, cell);
        kit.click(cell, pick, () => pick(el.z));
      }
      // Legend.
      const ly = o.y + 268;
      const t = TREND[o.trend];
      if (t) {
        [0.08, 0.44, 0.8].forEach((a, i) => kit.el("rect", { x: o.x + 30 + i * 24, y: ly - 14, width: 22, height: 18, rx: 3, fill: `rgba(74, 127, 224, ${a})` }, g));
        kit.el("text", { x: o.x + 110, y: ly, class: "simkit-tick", text: `${t.label}: lighter = smaller, darker = larger` }, g);
      } else {
        let lx = o.x + 30;
        for (const [kind, fill] of Object.entries(KIND)) {
          kit.el("rect", { x: lx, y: ly - 14, width: 18, height: 18, rx: 3, fill, stroke: kit.colors.line }, g);
          kit.el("text", { x: lx + 24, y: ly, class: "simkit-tick", text: kind }, g);
          lx += 34 + kind.length * 8;
        }
      }
      // The selected element: card, shells and values.
      const py = o.y + 296;
      kit.el("rect", { x: o.x + 30, y: py, width: 160, height: 170, rx: 10, fill: KIND[s.kind], stroke: kit.colors.ink, "stroke-width": 2 }, g);
      kit.el("text", { x: o.x + 42, y: py + 24, class: "simkit-label", fill: kit.colors.ink, text: String(s.z) }, g);
      kit.el("text", { x: o.x + 110, y: py + 92, "text-anchor": "middle", class: "simkit-label", style: "font-size:52px", fill: kit.colors.ink, text: s.symbol }, g);
      kit.el("text", { x: o.x + 110, y: py + 128, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: s.name }, g);
      kit.el("text", { x: o.x + 110, y: py + 152, "text-anchor": "middle", class: "simkit-tick", text: s.kind }, g);
      const bx = o.x + 320;
      const by = py + 86;
      kit.el("circle", { cx: bx, cy: by, r: 11, fill: kit.colors.red }, g);
      s.shells.forEach((count, i) => {
        const r = 26 + i * 18;
        kit.el("circle", { cx: bx, cy: by, r, fill: "none", stroke: kit.colors.line, "stroke-width": 1.5 }, g);
        for (let k = 0; k < count; k++) {
          const a = (2 * Math.PI * k) / count - Math.PI / 2;
          kit.el("circle", { cx: bx + r * Math.cos(a), cy: by + r * Math.sin(a), r: 4.5, fill: kit.colors.blue }, g);
        }
      });
      kit.el("text", { x: bx, y: py + 186, "text-anchor": "middle", class: "simkit-tick", text: `shells ${s.shells.join(", ")}` }, g);
      const hide = (v, unit) => (o.showValues ? `${v}${unit ? " " + unit : ""}` : "?");
      const rows = [
        `group ${s.group} · period ${s.period}`,
        `valence electrons: ${s.valence}`,
        `atomic radius: ${hide(s.radius, "pm")}`,
        `electronegativity: ${s.electronegativity == null ? (o.showValues ? "none" : "?") : hide(kit.fmt(s.electronegativity, 2))}`,
        `first ionisation energy: ${hide(s.ionization, "kJ/mol")}`,
      ];
      rows.forEach((text, i) => kit.el("text", { x: o.x + 440, y: py + 28 + i * 32, class: "simkit-label", fill: kit.colors.ink, text }, g));
    }

    draw();

    return {
      update(next) {
        for (const key of ["z", "trend"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ values: false }) writes "?" for the radius, electronegativity and ionisation energy (the shading stays). */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };
})();
