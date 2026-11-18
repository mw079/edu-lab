/* simkit.equilibrium: A + B ⇌ C in a box of particles, with start and equilibrium amounts (Le Chatelier). */
(function () {
  "use strict";
  const kit = window.simkit;
  const PER = 10; // particles drawn per mol/L

  /**
   * opts: { x=40, y=40 (top left), a=2, b=2, c=0 (mol/L at the start, 0–5 each), temp=25 (°C, 0–100),
   *         K=2 (equilibrium constant at 25 °C, L/mol), dH=-40 (kJ/mol for the forward reaction; negative = it gives out
   *         heat, so heating shifts the mixture back to A and B), showResult=true,
   *         drag: { a: app.link("key") } (the student drags the top of the "start" bar of A to add or remove A) }
   * Left: the box of particles (A red, B blue, C = a joined red–blue pair) at equilibrium, or at the start while the
   * result is hidden. Right: start and equilibrium amounts as bars.
   * Returns { update({ a, b, c, temp, K, dH }), show({ result }), run() → Promise (the start mixture settles), values() }
   * values() -> { a, b, c (mol/L at equilibrium), K (at this temperature), Q, formed, shift ("right", "left", "none") }
   *   (see simkit.physics.equilibrium)
   */
  kit.equilibrium = function (stage, opts) {
    const o = Object.assign({ x: 40, y: 40, a: 2, b: 2, c: 0, temp: 25, K: 2, dH: -40, showResult: true }, opts);
    const g = stage.layer({ class: "simkit-equilibrium" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const addA = o.drag && o.drag.a;
    const base = o.y + 400;
    const TOP = 6; // the bar chart's axis runs 0–6 mol/L; a taller bar is cut at the top (its number still shows)
    const SCALE = 300 / TOP; // px per mol/L
    const barX = (i, start) => o.x + 520 + i * 140 + (start ? -26 : 26);
    const dragger = kit.drag(stage, handle, addA, (p) => addA(kit.clamp((base - p.y) / SCALE, 0, 5)));
    const bar = (v) => Math.min(TOP, Math.max(0, v)) * SCALE;
    const sol = () => kit.physics.equilibrium(o.a, o.b, o.c, o.temp, o.K, o.dH);
    // Fixed shuffled places for the particles, so the picture does not jump when the amounts change.
    const slots = [];
    for (let j = 0; j < 11; j++) for (let i = 0; i < 12; i++) slots.push([o.x + 22 + i * 30, o.y + 70 + j * 30]);
    let seed = 7;
    for (let i = slots.length - 1; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const k = seed % (i + 1);
      [slots[i], slots[k]] = [slots[k], slots[i]];
    }

    function draw(t) {
      pic.textContent = "";
      handle.textContent = "";
      const s = sol();
      const p = t == null ? (o.showResult ? 1 : 0) : t;
      const now = { a: o.a + (s.a - o.a) * p, b: o.b + (s.b - o.b) * p, c: o.c + (s.c - o.c) * p };
      const hot = (o.dH || 0) < 0 ? "gives out heat" : "takes in heat";
      kit.el("text", { x: o.x, y: o.y + 18, class: "simkit-label", style: "font-size:20px", fill: kit.colors.ink, text: "A + B ⇌ C" }, pic);
      kit.el("text", { x: o.x + 130, y: o.y + 18, class: "simkit-tick", text: `forward reaction ${hot} · ${kit.fmt(o.temp, 0)} °C` }, pic);
      // Box of particles.
      kit.el("rect", { x: o.x, y: o.y + 48, width: 372, height: 342, rx: 8, fill: "#fff", stroke: kit.colors.ink, "stroke-width": 3 }, pic);
      const counts = [Math.round(now.a * PER), Math.round(now.b * PER), Math.round(now.c * PER)];
      let k = 0;
      const place = () => slots[k++ % slots.length];
      for (let i = 0; i < counts[0]; i++) {
        const [px, py] = place();
        kit.el("circle", { cx: px, cy: py, r: 8, fill: kit.colors.red }, pic);
      }
      for (let i = 0; i < counts[1]; i++) {
        const [px, py] = place();
        kit.el("circle", { cx: px, cy: py, r: 8, fill: kit.colors.blue }, pic);
      }
      for (let i = 0; i < counts[2]; i++) {
        const [px, py] = place();
        kit.el("circle", { cx: px - 6, cy: py, r: 7, fill: kit.colors.red }, pic);
        kit.el("circle", { cx: px + 6, cy: py, r: 7, fill: kit.colors.blue }, pic);
      }
      kit.el("text", { x: o.x, y: o.y + 420, class: "simkit-tick", text: p >= 1 ? "the mixture at equilibrium" : p <= 0 ? "the mixture at the start" : "settling…" }, pic);
      // Bars: start (pale) and equilibrium (solid) for A, B and C.
      kit.el("line", { x1: o.x + 450, y1: base, x2: o.x + 900, y2: base, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      for (let v = 0; v <= TOP; v += 1) {
        kit.el("line", { x1: o.x + 444, y1: base - v * SCALE, x2: o.x + 450, y2: base - v * SCALE, stroke: kit.colors.ink, "stroke-width": 1 }, pic);
        kit.el("text", { x: o.x + 438, y: base - v * SCALE + 5, "text-anchor": "end", class: "simkit-tick", text: String(v) }, pic);
      }
      kit.el("text", { x: o.x + 450, y: o.y + 66, class: "simkit-tick", text: "mol/L" }, pic);
      const names = ["A", "B", "C"];
      const colors = [kit.colors.red, kit.colors.blue, kit.colors.purple];
      const start = [o.a, o.b, o.c];
      const end = [now.a, now.b, now.c];
      names.forEach((n, i) => {
        const h0 = bar(start[i]);
        kit.el("rect", { x: barX(i, true) - 20, y: base - h0, width: 40, height: h0, fill: colors[i], "fill-opacity": 0.3 }, pic);
        // Above the drag ring on A's bar, and at the same height on the others.
        kit.el("text", { x: barX(i, true), y: base - h0 - 30, "text-anchor": "middle", class: "simkit-tick", text: kit.fmt(start[i], 1) }, pic);
        if (p > 0) {
          const h1 = bar(end[i]);
          kit.el("rect", { x: barX(i, false) - 20, y: base - h1, width: 40, height: h1, fill: colors[i] }, pic);
          kit.el("text", { x: barX(i, false), y: base - h1 - 8, "text-anchor": "middle", class: "simkit-label", fill: colors[i], text: kit.fmt(end[i], 2) }, pic);
        }
        kit.el("text", { x: barX(i, true) + 26, y: base + 24, "text-anchor": "middle", class: "simkit-label", fill: colors[i], text: n }, pic);
      });
      kit.el("text", { x: o.x + 470, y: base + 50, class: "simkit-tick", text: "pale: at the start · full: at equilibrium" }, pic);
      // Which way the mixture moves.
      const shift = !o.showResult && t == null ? "? which way does it shift" : s.shift === "right" ? "shifts right → more C" : s.shift === "left" ? "shifts left ← more A and B" : "already at equilibrium";
      kit.el("text", { x: o.x + 450, y: o.y + 18, class: "simkit-label", fill: kit.colors.ink, text: shift }, pic);
      kit.el("text", { x: o.x + 450, y: o.y + 42, class: "simkit-tick", text: o.showResult ? `K = ${kit.fmt(s.K, s.K < 1 ? 2 : 1)} at ${kit.fmt(o.temp, 0)} °C` : "K = ?" }, pic);
      // Grip on top of A's start bar.
      if (kit.linked(addA)) kit.grip(handle, barX(0, true), base - bar(o.a), 22);
      else kit.el("circle", { cx: barX(0, true), cy: base - bar(o.a), r: 22, fill: "#fff", "fill-opacity": 0.01 }, handle);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["a", "b", "c", "temp", "K", "dH"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ result: false }) shows the start mixture, removes the equilibrium bars and writes "?" for the shift and K. */
      show(which) {
        if (which.result != null) o.showResult = which.result;
        draw();
      },
      /** The particles settle from the start mixture to equilibrium. */
      run() {
        return stage.animate(1.6, (p) => draw(p)).then((done) => {
          draw();
          return done;
        });
      },
      values: sol,
    };
  };
})();
