/* simkit.rockCycle: the rock cycle, with the processes that can act on the current rock. */
(function () {
  "use strict";
  const kit = window.simkit;
  const ABOUT = [
    ["Melted rock below the surface.", "As it cools it turns into igneous rock."],
    ["Cooled magma, made of crystals.", "Examples: granite, basalt."],
    ["Bits of rock broken off and carried", "by water, wind or ice."],
    ["Layers of sediment pressed together.", "Examples: sandstone, limestone."],
    ["Rock changed by heat and pressure", "without melting. Examples: marble, slate."],
  ];

  /**
   * opts: { x=40, y=30 (top left), rock=1 (0 magma, 1 igneous rock, 2 sediment, 3 sedimentary rock, 4 metamorphic rock),
   *         showNames=true, showProcesses=true (false hides the arrows of the processes that can act on the rock),
   *         click: { rock: app.link("key") } (the student clicks a process to apply it to the rock) }
   * The five stages sit on a ring; arrows show the processes that can act on the current rock (with their names).
   * A sample of the current rock and a short description are on the right.
   * Returns { update({ rock }), show({ names, processes }), values() }
   * values() -> { rock, name, next: [{ process, to, name }] }   (see simkit.physics.rockCycle)
   */
  kit.rockCycle = function (stage, opts) {
    const o = Object.assign({ x: 40, y: 30, rock: 1, showNames: true, showProcesses: true }, opts);
    const g = stage.layer({ class: "simkit-rocks" });
    const apply = o.click && o.click.rock;
    const sol = () => kit.physics.rockCycle(o.rock);
    // A ring, clockwise from the top: sediment, sedimentary, metamorphic, magma, igneous (wide at the bottom so the
    // arrow between magma and metamorphic rock has room for its label).
    const at = { 2: [300, 60], 3: [515, 200], 4: [460, 420], 0: [140, 420], 1: [85, 200] };
    const pos = (r) => [o.x + at[r][0], o.y + at[r][1]];
    const BW = 150;
    const BH = 44;
    // Point where a line from a box centre in direction (ux, uy) leaves the box.
    const edge = ([x, y], ux, uy) => {
      const t = Math.min(ux ? BW / 2 / Math.abs(ux) : Infinity, uy ? BH / 2 / Math.abs(uy) : Infinity) + 6;
      return [x + ux * t, y + uy * t];
    };

    function sample(r, x, y) {
      const box = kit.el("g", null, g);
      kit.el("rect", { x, y, width: 260, height: 160, rx: 14, fill: ["#e8673c", "#c9c2b8", "#e6d3a8", "#d9b98a", "#9aa3ab"][r], stroke: kit.colors.ink, "stroke-width": 2 }, box);
      let seed = 11 + r;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      if (r === 0) for (let i = 0; i < 18; i++) kit.el("circle", { cx: x + 20 + rnd() * 220, cy: y + 20 + rnd() * 120, r: 4 + rnd() * 8, fill: "#ffd166", opacity: 0.7 }, box);
      if (r === 1)
        for (let i = 0; i < 60; i++) {
          // Crystals turned about their own centre, so they stay inside the sample.
          const qx = x + 18 + rnd() * 218;
          const qy = y + 16 + rnd() * 124;
          kit.el("rect", { x: qx - 6, y: qy - 4, width: 6 + rnd() * 8, height: 5 + rnd() * 6, fill: ["#3d3d3d", "#f2f2f2", "#e8b4a0"][i % 3], transform: `rotate(${(rnd() * 90).toFixed(0)} ${qx} ${qy})` }, box);
        }
      if (r === 2) for (let i = 0; i < 90; i++) kit.el("circle", { cx: x + 12 + rnd() * 236, cy: y + 12 + rnd() * 136, r: 2 + rnd() * 4, fill: ["#b08a55", "#8c6d3f", "#d7c08f"][i % 3] }, box);
      if (r === 3) for (let i = 0; i < 6; i++) kit.el("rect", { x: x + 2, y: y + 8 + i * 25, width: 256, height: 18, fill: ["#c49a6c", "#e3c99b", "#b5865a"][i % 3] }, box);
      if (r === 4) for (let i = 0; i < 7; i++) kit.el("path", { d: `M ${x + 4} ${y + 18 + i * 21} q 32 -12 64 0 t 64 0 t 64 0 t 62 0`, fill: "none", stroke: i % 2 ? "#5f6872" : "#e6e8ea", "stroke-width": 7 }, box);
    }

    function draw() {
      g.textContent = "";
      const s = sol();
      // The main loop, faint.
      for (const [a, b] of [[1, 2], [2, 3], [3, 4], [4, 0], [0, 1]]) {
        const [x1, y1] = pos(a);
        const [x2, y2] = pos(b);
        kit.el("line", { x1, y1, x2, y2, stroke: kit.colors.line, "stroke-width": 3 }, g);
      }
      // The processes that can act on the current rock. Each label goes where it covers no box and no other label.
      const boxes = s.names.map((_, r) => {
        const [x, y] = pos(r);
        return { x: x - BW / 2 - 4, y: y - BH / 2 - 4, w: BW + 8, h: BH + 8 };
      });
      const taken = [];
      const hits = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      for (const step of o.showProcesses ? s.next : []) {
        const from = pos(s.rock);
        const to = pos(step.to);
        const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
        const ux = (to[0] - from[0]) / len;
        const uy = (to[1] - from[1]) / len;
        const [x1, y1] = edge(from, ux, uy);
        const [x2, y2] = edge(to, -ux, -uy);
        const arrow = kit.el("g", null, g);
        kit.arrowShape(arrow, x1, y1, x2, y2, { color: kit.colors.orange, width: 5, head: 15 });
        const w = step.process.length * 8.4 + 16;
        // Try points along the arrow, starting where arrows leaving the same rock have spread apart.
        let mx = 0;
        let my = 0;
        for (const t of [0.6, 0.5, 0.7, 0.4, 0.35, 0.65, 0.3]) {
          mx = x1 + (x2 - x1) * t;
          my = y1 + (y2 - y1) * t;
          const rect = { x: mx - w / 2 - 4, y: my - 18, w: w + 8, h: 32 };
          if (!boxes.some((b) => hits(rect, b)) && !taken.some((b) => hits(rect, b))) break;
        }
        taken.push({ x: mx - w / 2 - 4, y: my - 18, w: w + 8, h: 32 });
        if (kit.linked(apply)) kit.el("rect", { x: mx - w / 2 - 4, y: my - 18, width: w + 8, height: 32, rx: 16, fill: kit.colors.purple, "fill-opacity": 0.16, stroke: kit.colors.purple, "stroke-opacity": 0.5, "stroke-width": 2, "stroke-dasharray": "4 5", class: "simkit-grip" }, arrow);
        kit.el("rect", { x: mx - w / 2, y: my - 14, width: w, height: 24, rx: 12, fill: "#fff" }, arrow);
        kit.el("text", { x: mx, y: my + 4, "text-anchor": "middle", class: "simkit-label", style: "font-size:14px", fill: kit.colors.ink, text: step.process }, arrow);
        kit.click(arrow, apply, () => apply(step.to));
      }
      // Stage boxes.
      s.names.forEach((name, r) => {
        const [x, y] = pos(r);
        const current = r === s.rock;
        kit.el("rect", { x: x - BW / 2, y: y - BH / 2, width: BW, height: BH, rx: 10, fill: current ? kit.colors.yellow : "#fff", stroke: kit.colors.ink, "stroke-width": current ? 3 : 2 }, g);
        kit.el("text", { x, y: y + 6, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.showNames || current ? name : "?" }, g);
      });
      // Sample of the current rock.
      const px = o.x + 620;
      kit.el("text", { x: px, y: o.y + 60, class: "simkit-label", style: "font-size:20px", fill: kit.colors.ink, text: s.name }, g);
      sample(s.rock, px, o.y + 80);
      ABOUT[s.rock].forEach((line, i) => kit.el("text", { x: px, y: o.y + 276 + i * 22, class: "simkit-tick", text: line }, g));
      kit.el("text", { x: px, y: o.y + 340, class: "simkit-tick", text: !o.showProcesses ? "Which processes can act on this rock?" : s.next.length > 1 ? "Click a process to see what it makes." : "Click the process to see what it makes." }, g);
    }

    draw();

    return {
      update(next) {
        if (next.rock != null) o.rock = next.rock;
        draw();
      },
      /**
       * show({ names: false }) writes "?" in the other stages' boxes (to ask what a process makes);
       * show({ processes: false }) hides the process arrows (to ask which processes can act on the rock).
       */
      show(which) {
        if (which.names != null) o.showNames = which.names;
        if (which.processes != null) o.showProcesses = which.processes;
        draw();
      },
      values: sol,
    };
  };
})();
