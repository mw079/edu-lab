/* simkit.pulley, simkit.gearTrain. */
(function () {
  "use strict";
  const kit = window.simkit;
  const whole = (v) => kit.fmt(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1);

  /**
   * opts: { x=330, y=50 (middle of the beam), load=120 (N), ropes=2 (strands holding the load, 1–4),
   *         lift=0 (m the load has been raised, 0–2), showValues=true,
   *         drag: { lift: app.link("key") } (the student pulls the free end of the rope down) }
   * Returns { update({ load, ropes, lift }), show({ effort, pull }), values() }
   * values() -> { effort (N), advantage, pull (m of rope pulled), work (J) }   (see simkit.physics.pulley)
   */
  kit.pulley = function (stage, opts) {
    const o = Object.assign({ x: 330, y: 50, load: 120, ropes: 2, lift: 0, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-pulley" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const shown = { effort: o.showValues, pull: o.showValues };
    const PX = 30; // px per metre
    const hx = o.x + 170;
    const hand0 = o.y + 150;
    const haul = o.drag && o.drag.lift;
    const count = () => kit.clamp(Math.round(o.ropes), 1, 4);
    const dragger = kit.drag(stage, handle, haul, (p) => haul(kit.clamp((p.y - hand0) / PX / count(), 0, 2)));
    const sol = () => kit.physics.pulley(o.load, o.ropes, o.lift);

    function draw() {
      pic.textContent = "";
      const s = sol();
      const n = count();
      const topY = o.y + 60;
      const blockY = o.y + 330 - o.lift * PX;
      const handY = hand0 + s.pull * PX;
      const rope = { stroke: "#7a6a4a", "stroke-width": 3, "stroke-linecap": "round", fill: "none" };
      kit.el("rect", { x: o.x - 240, y: o.y, width: 480, height: 16, rx: 4, fill: kit.colors.steel }, pic);
      // The strands that hold the load (count them: each carries an equal share).
      for (let i = 0; i < n; i++) {
        const sx = o.x + (i - (n - 1) / 2) * 24;
        kit.el("line", Object.assign({ x1: sx, y1: topY, x2: sx, y2: blockY }, rope), pic);
      }
      // The free end: over the top wheel, across to a second wheel and down to the hand.
      kit.el("path", Object.assign({ d: `M ${o.x + ((n - 1) / 2) * 24} ${topY - 26} H ${hx} V ${handY}` }, rope), pic);
      for (const wx of [o.x, hx]) {
        kit.el("line", { x1: wx, y1: o.y + 16, x2: wx, y2: topY, stroke: kit.colors.ink, "stroke-width": 3 }, pic);
        kit.el("circle", { cx: wx, cy: topY, r: wx === o.x ? 26 : 16, fill: "#fff", stroke: kit.colors.ink, "stroke-width": 3 }, pic);
        kit.el("circle", { cx: wx, cy: topY, r: 4, fill: kit.colors.ink }, pic);
      }
      if (n > 1) kit.el("circle", { cx: o.x, cy: blockY, r: 22, fill: "#fff", stroke: kit.colors.ink, "stroke-width": 3 }, pic);
      kit.el("line", { x1: o.x, y1: blockY + (n > 1 ? 22 : 0), x2: o.x, y2: blockY + 40, stroke: kit.colors.ink, "stroke-width": 3 }, pic);
      kit.el("rect", { x: o.x - 55, y: blockY + 40, width: 110, height: 64, rx: 8, fill: kit.colors.blue, "fill-opacity": 0.75, stroke: kit.colors.blueDark, "stroke-width": 2 }, pic);
      kit.el("text", { x: o.x, y: blockY + 78, "text-anchor": "middle", class: "simkit-label", fill: "#fff", text: `${kit.fmt(o.load, 0)} N` }, pic);
      kit.el("line", { x1: o.x - 150, y1: o.y + 470, x2: o.x + 110, y2: o.y + 470, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      // The pull on the free end.
      const len = kit.clamp((s.effort / 120) * 60, 24, 90);
      kit.arrowShape(pic, hx, handY + 14, hx, handY + 14 + len, { color: kit.colors.red, width: 6, head: 14 });
      const lx = o.x + 290;
      const rows = [
        [kit.colors.ink, `${n} rope${n === 1 ? "" : "s"} hold${n === 1 ? "s" : ""} the load`],
        [kit.colors.red, shown.effort ? `pull needed: ${whole(o.load)} ÷ ${n} = ${whole(s.effort)} N` : "pull needed: ? N"],
        [kit.colors.blue, `load lifted: ${kit.fmt(o.lift, 1)} m`],
        [kit.colors.ink, shown.pull ? `rope pulled: ${kit.fmt(s.pull, 1)} m` : "rope pulled: ? m"],
        [kit.colors.ink, shown.effort && shown.pull ? `work: ${whole(s.effort)} N × ${kit.fmt(s.pull, 1)} m = ${whole(s.work)} J` : "work: ? J"],
      ];
      rows.forEach(([color, text], i) => kit.el("text", { x: lx, y: o.y + 110 + i * 42, class: "simkit-label", fill: color, text }, pic));
      handle.textContent = "";
      if (kit.linked(haul)) kit.grip(handle, hx, handY, 22);
      else kit.el("circle", { cx: hx, cy: handY, r: 22, fill: "#fff", "fill-opacity": 0.01 }, handle);
      kit.el("circle", { cx: hx, cy: handY, r: 8, fill: kit.colors.red, stroke: "#fff", "stroke-width": 2 }, handle);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["load", "ropes", "lift"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ effort: false }) writes "? N" for the pull; show({ pull: false }) writes "? m" for the rope pulled. */
      show(which) {
        for (const key of ["effort", "pull"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=330, y=230 (the point where the two gears touch), driver=12, driven=24 (teeth, 8–32), turns=0 (turns of
   *         the driver, 0–4), showValues=true,
   *         drag: { turns: app.link("key") } (the student turns the driver gear by its handle) }
   * Returns { update({ driver, driven, turns }), show({ ratio, outTurns }), values() }
   * values() -> { ratio, outTurns, speedTimes, forceTimes, direction }   (see simkit.physics.gears)
   */
  kit.gearTrain = function (stage, opts) {
    const o = Object.assign({ x: 330, y: 230, driver: 12, driven: 24, turns: 0, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-gears" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const shown = { ratio: o.showValues, outTurns: o.showValues };
    const R = (teeth) => kit.clamp(teeth, 8, 32) * 4.5;
    const crank = o.drag && o.drag.turns;
    const angleAt = (p) => Math.atan2(p.y - o.y, p.x - (o.x - R(o.driver)));
    const dragger = kit.drag(
      stage,
      handle,
      crank,
      (p, start, from) => {
        let d = angleAt(p) - from.angle;
        d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest way round
        crank(kit.clamp(from.turns + d / (2 * Math.PI), 0, 4));
      },
      (start) => ({ turns: o.turns, angle: angleAt(start) })
    );
    const sol = () => kit.physics.gears(o.driver, o.driven, o.turns);

    function gear(cx, cy, teeth, angle, color) {
      const r = R(teeth);
      const N = Math.round(kit.clamp(teeth, 8, 32));
      const pts = [];
      // Each tooth: up, across the top, down, across the gap.
      for (let k = 0; k < N; k++)
        for (const [f, rr] of [[-0.25, r - 6], [-0.15, r + 6], [0.15, r + 6], [0.25, r - 6]]) {
          const t = angle + ((k + f) * 2 * Math.PI) / N;
          pts.push(`${(cx + rr * Math.cos(t)).toFixed(1)},${(cy + rr * Math.sin(t)).toFixed(1)}`);
        }
      kit.el("polygon", { points: pts.join(" "), fill: color, "fill-opacity": 0.4, stroke: kit.colors.ink, "stroke-width": 2, "stroke-linejoin": "round" }, pic);
      kit.el("circle", { cx, cy, r: 8, fill: kit.colors.ink }, pic);
      return [cx + (r - 18) * Math.cos(angle), cy + (r - 18) * Math.sin(angle)];
    }

    function draw() {
      pic.textContent = "";
      const s = sol();
      const r1 = R(o.driver);
      const r2 = R(o.driven);
      const a1 = o.turns * 2 * Math.PI - Math.PI / 2; // the mark starts at the top
      // The driven gear turns the other way; its teeth sit in the driver's gaps where they meet.
      const N1 = Math.round(kit.clamp(o.driver, 8, 32));
      const N2 = Math.round(kit.clamp(o.driven, 8, 32));
      const a2 = -Math.PI / 2 - s.outTurns * 2 * Math.PI;
      const m1 = gear(o.x - r1, o.y, o.driver, a1, kit.colors.orange);
      gear(o.x + r2, o.y, o.driven, Math.PI - Math.PI / N2 - (a1 * N1) / N2, kit.colors.blue);
      // Marks: one dot per gear that shows how far it has turned.
      kit.el("circle", { cx: o.x + r2 + (r2 - 18) * Math.cos(a2), cy: o.y + (r2 - 18) * Math.sin(a2), r: 7, fill: kit.colors.blueDark, stroke: "#fff", "stroke-width": 2 }, pic);
      const by = o.y + Math.max(r1, r2) + 40;
      kit.el("text", { x: o.x - r1, y: by, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.orange, text: `driver: ${N1} teeth` }, pic);
      // Small gears sit close together: then the second label goes one line lower.
      const stagger = r1 + r2 < 150 ? 24 : 0;
      kit.el("text", { x: o.x + r2, y: by + stagger, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.blue, text: `driven: ${N2} teeth` }, pic);
      const lx = o.x + 2 * 144 + 40;
      const rows = [
        [kit.colors.ink, shown.ratio ? `gear ratio: ${N2} ÷ ${N1} = ${kit.fmt(s.ratio, 2)}` : "gear ratio: ?"],
        [kit.colors.orange, `driver: ${kit.fmt(o.turns, 2)} turns`],
        [kit.colors.blue, shown.outTurns ? `driven: ${kit.fmt(s.outTurns, 2)} turns, the other way` : "driven: ? turns"],
        [kit.colors.ink, shown.ratio ? `speed × ${kit.fmt(s.speedTimes, 2)} · turning force × ${kit.fmt(s.forceTimes, 2)}` : "speed × ? · turning force × ?"],
      ];
      rows.forEach(([color, text], i) => kit.el("text", { x: lx, y: o.y - 60 + i * 42, class: "simkit-label", fill: color, text }, pic));
      handle.textContent = "";
      if (kit.linked(crank)) kit.grip(handle, m1[0], m1[1], 22);
      else kit.el("circle", { cx: m1[0], cy: m1[1], r: 22, fill: "#fff", "fill-opacity": 0.01 }, handle);
      kit.el("circle", { cx: m1[0], cy: m1[1], r: 7, fill: kit.colors.orange, stroke: "#fff", "stroke-width": 2 }, handle);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["driver", "driven", "turns"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ ratio: false }) writes "?" for the ratio, speed and force; show({ outTurns: false }) for the driven gear's turns. */
      show(which) {
        for (const key of ["ratio", "outTurns"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      values: sol,
    };
  };
})();
