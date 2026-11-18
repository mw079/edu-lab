/* simkit.magnetCoil, simkit.electromagnet: electromagnetic induction and the magnetic field of a current. */
(function () {
  "use strict";
  const kit = window.simkit;
  const COPPER = "#b5743a";

  /** A bar magnet: N half red, S half blue. `northRight` puts N on the right. */
  function barMagnet(parent, x, y, w, h, northRight) {
    const half = w / 2;
    const [left, right] = northRight ? [["S", kit.colors.blue], ["N", kit.colors.red]] : [["N", kit.colors.red], ["S", kit.colors.blue]];
    kit.el("rect", { x, y, width: half, height: h, rx: 4, fill: left[1] }, parent);
    kit.el("rect", { x: x + half, y, width: half, height: h, rx: 4, fill: right[1] }, parent);
    kit.el("text", { x: x + half / 2, y: y + h / 2 + 7, "text-anchor": "middle", class: "simkit-label", style: "font-size:20px", fill: "#fff", text: left[0] }, parent);
    kit.el("text", { x: x + half + half / 2, y: y + h / 2 + 7, "text-anchor": "middle", class: "simkit-label", style: "font-size:20px", fill: "#fff", text: right[0] }, parent);
  }

  /**
   * opts: { x=440, y=200 (centre of the coil), turns=10 (5–50), speed=2 (m/s the magnet moves: + into the coil,
   *         − out of it, 0 = still; −4…4), strength=1 (magnet strength 1–3), showReading=true,
   *         drag: { speed: app.link("key") } (the student pushes or pulls the magnet: how far sets the speed) }
   * The magnet sits left of the coil with its N pole facing it; a meter below the coil shows the induced voltage.
   * Returns { update({ turns, speed, strength }), show({ reading }), run() → Promise (the magnet moves), values() }
   * values() -> { emf (mV, + = needle right), size, direction }   (see simkit.physics.induction)
   */
  kit.magnetCoil = function (stage, opts) {
    const o = Object.assign({ x: 440, y: 200, turns: 10, speed: 2, strength: 1, showReading: true }, opts);
    const g = stage.layer({ class: "simkit-magnetcoil" });
    const pic = kit.el("g", null, g);
    const magnetG = kit.el("g", null, g);
    const needleG = kit.el("g", null, g);
    const rest = o.x - 330; // left edge of the magnet at rest
    const push = o.drag && o.drag.speed;
    let offset = 0; // px the magnet has moved (while run() animates)
    let moving = false;
    const sol = () => kit.physics.induction(o.turns, o.speed, o.strength);
    const dragger = kit.drag(
      stage,
      magnetG,
      push,
      (p, start, data) => push(kit.clamp(data + (p.x - start.x) / 30, -4, 4)),
      () => o.speed
    );

    function drawStatic() {
      pic.textContent = "";
      // Coil: copper loops between x − 100 and x + 100.
      // One loop drawn per two turns (so more turns look denser), joined along the back like a spring.
      const loops = kit.clamp(Math.round(o.turns / 2), 3, 25);
      const step = 190 / Math.max(1, loops - 1);
      for (let i = 0; i < loops; i++) {
        const lx = o.x - 95 + step * i;
        // The back of each turn: a faint straight line from the bottom of this loop to the top of the next.
        if (i < loops - 1) kit.el("line", { x1: lx, y1: o.y + 62, x2: lx + step, y2: o.y - 62, stroke: COPPER, "stroke-width": 2, opacity: 0.45 }, pic);
        kit.el("path", { d: `M ${lx} ${o.y - 62} A 12 62 0 0 1 ${lx} ${o.y + 62}`, fill: "none", stroke: COPPER, "stroke-width": 4 }, pic);
      }
      kit.el("text", { x: o.x, y: o.y - 82, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `coil: ${kit.fmt(o.turns, 0)} turns` }, pic);
      // Wires from the coil's ends down to the meter.
      const wire = { fill: "none", stroke: COPPER, "stroke-width": 3 };
      kit.el("path", Object.assign({ d: `M ${o.x - 95} ${o.y + 62} V ${o.y + 130} H ${o.x - 70} V ${o.y + 150}` }, wire), pic);
      kit.el("path", Object.assign({ d: `M ${o.x + 95} ${o.y + 62} V ${o.y + 130} H ${o.x + 70} V ${o.y + 150}` }, wire), pic);
      // Meter: a dial with a needle; 0 in the middle.
      const mx = o.x;
      const my = o.y + 250;
      kit.el("rect", { x: mx - 100, y: o.y + 150, width: 200, height: 120, rx: 10, fill: "#fff", stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      kit.el("path", { d: `M ${mx - 78} ${my} A 78 78 0 0 1 ${mx + 78} ${my}`, fill: "none", stroke: kit.colors.line, "stroke-width": 2 }, pic);
      for (const t of [-60, -30, 0, 30, 60]) {
        const r = (t * Math.PI) / 180;
        kit.el("line", { x1: mx + 70 * Math.sin(r), y1: my - 70 * Math.cos(r), x2: mx + 80 * Math.sin(r), y2: my - 80 * Math.cos(r), stroke: kit.colors.ink, "stroke-width": t ? 1 : 2 }, pic);
      }
      kit.el("text", { x: mx, y: my - 86, "text-anchor": "middle", class: "simkit-tick", text: "0" }, pic);
      // Magnet strength as a label under the magnet.
      kit.el("text", { x: rest + 90, y: o.y + 60, "text-anchor": "middle", class: "simkit-tick", text: `magnet strength ${kit.fmt(o.strength, 0)}` }, pic);
    }

    function drawMoving(reading) {
      magnetG.textContent = "";
      const mx = rest + offset;
      if (kit.linked(push) && !moving) kit.el("rect", { x: mx - 8, y: o.y - 33, width: 196, height: 66, rx: 10, fill: kit.colors.purple, "fill-opacity": 0.12, stroke: kit.colors.purple, "stroke-opacity": 0.5, "stroke-width": 2, "stroke-dasharray": "4 5", class: "simkit-grip" }, magnetG);
      barMagnet(magnetG, mx, o.y - 25, 180, 50, true);
      // Velocity arrow and label above the magnet.
      const v = o.speed;
      if (Math.abs(v) > 1e-9) {
        const len = 18 + Math.abs(v) * 22;
        const ax = mx + 90;
        kit.arrowShape(magnetG, ax - (v > 0 ? len / 2 : -len / 2), o.y - 56, ax + (v > 0 ? len / 2 : -len / 2), o.y - 56, { color: kit.colors.green, width: 5, head: 13 });
      }
      kit.el("text", { x: mx + 90, y: o.y - 74, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.green, text: Math.abs(v) < 1e-9 ? "magnet still" : `${v > 0 ? "into" : "out of"} the coil at ${kit.fmt(Math.abs(v), 1)} m/s` }, magnetG);
      dragger.refresh();
      // Needle and reading.
      needleG.textContent = "";
      const mxm = o.x;
      const my = o.y + 250;
      const full = 6000;
      const shown = o.showReading;
      const ang = shown ? Math.sign(reading) * 60 * Math.sqrt(Math.min(1, Math.abs(reading) / full)) : 0;
      const r = (ang * Math.PI) / 180;
      if (shown) kit.el("line", { x1: mxm, y1: my, x2: mxm + 72 * Math.sin(r), y2: my - 72 * Math.cos(r), stroke: kit.colors.red, "stroke-width": 3, "stroke-linecap": "round" }, needleG);
      kit.el("circle", { cx: mxm, cy: my, r: 5, fill: kit.colors.ink }, needleG);
      kit.el("text", { x: mxm + 130, y: o.y + 215, "text-anchor": "start", class: "simkit-label", fill: kit.colors.red, text: shown ? `${kit.fmt(reading, 0)} mV` : "? mV" }, needleG);
      kit.el("text", { x: mxm + 130, y: o.y + 240, "text-anchor": "start", class: "simkit-tick", text: "induced voltage" }, needleG);
    }

    function draw() {
      drawStatic();
      drawMoving(sol().emf);
    }

    draw();

    return {
      update(next) {
        for (const key of ["turns", "speed", "strength"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ reading: false }) hides the needle and writes "? mV". */
      show(which) {
        if (which.reading != null) o.showReading = which.reading;
        draw();
      },
      /** The magnet moves into (or out of) the coil; the needle swings while it moves and returns to 0. */
      run() {
        const v = o.speed;
        if (Math.abs(v) < 1e-9) return Promise.resolve(true);
        const travel = 150;
        const seconds = kit.clamp(2 / Math.abs(v), 0.4, 2.5);
        const from = v > 0 ? 0 : travel;
        const to = v > 0 ? travel : 0;
        moving = true;
        return stage
          .animate(seconds, (p) => {
            offset = from + (to - from) * p;
            drawMoving(p < 1 ? sol().emf : 0);
          })
          .then((done) => {
            moving = false;
            offset = 0;
            drawMoving(sol().emf);
            return done;
          });
      },
      values: sol,
    };
  };

  /**
   * opts: { x=400, y=190 (centre of the coil), turns=20 (10–100), current=2 (A, −5…5: the sign swaps the poles),
   *         core=1 (1 = iron core, 0 = air), showField=true,
   *         click: { current: app.link("key") } (the student clicks the battery to reverse the current) }
   * Returns { update({ turns, current, core }), show({ field }), values() }
   * values() -> { field (mT), clips (paper clips it holds, 0–12), north ("right", "left" or "none") }
   *   (see simkit.physics.electromagnet)
   */
  kit.electromagnet = function (stage, opts) {
    const o = Object.assign({ x: 400, y: 190, turns: 20, current: 2, core: 1, showField: true }, opts);
    const g = stage.layer({ class: "simkit-electromagnet" });
    const flip = o.click && o.click.current;
    const sol = () => kit.physics.electromagnet(o.turns, o.current, o.core);

    function draw() {
      g.textContent = "";
      const s = sol();
      const L = o.x - 160;
      const R = o.x + 160;
      // Field lines outside the coil, from N round to S (only while a current flows).
      if (s.north !== "none") {
        const toRight = s.north === "left"; // outside the magnet the field runs from N to S
        for (const k of [1, 2]) {
          for (const side of [-1, 1]) {
            const h = 46 + k * 34;
            kit.el("path", { d: `M ${L - 6} ${o.y} C ${L - 40 - k * 20} ${o.y + side * h}, ${R + 40 + k * 20} ${o.y + side * h}, ${R + 6} ${o.y}`, fill: "none", stroke: kit.colors.purple, "stroke-width": 1.5, "stroke-dasharray": "6 5", opacity: 0.6 }, g);
            const ax = o.x;
            const ay = o.y + side * (h * 0.75);
            kit.arrowShape(g, ax - (toRight ? 7 : -7), ay, ax + (toRight ? 7 : -7), ay, { color: kit.colors.purple, width: 2, head: 9 });
          }
        }
      }
      // Core and coil.
      kit.el("rect", o.core ? { x: L, y: o.y - 20, width: 320, height: 40, rx: 6, fill: "#9aa3ab", stroke: kit.colors.ink, "stroke-width": 2 } : { x: L, y: o.y - 20, width: 320, height: 40, rx: 6, fill: "none", stroke: kit.colors.steel, "stroke-width": 2, "stroke-dasharray": "5 5" }, g);
      const loops = kit.clamp(Math.round(o.turns / 2.5), 4, 30);
      for (let i = 0; i < loops; i++) {
        const lx = L + 20 + (280 * i) / Math.max(1, loops - 1);
        kit.el("line", { x1: lx - 6, y1: o.y - 26, x2: lx + 6, y2: o.y + 26, stroke: COPPER, "stroke-width": 4, "stroke-linecap": "round" }, g);
      }
      kit.el("text", { x: o.x, y: o.y - 118, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `${kit.fmt(o.turns, 0)} turns, ${o.core ? "iron core" : "no core"}` }, g);
      // Poles.
      if (s.north !== "none") {
        const nRight = s.north === "right";
        kit.el("text", { x: L - 26, y: o.y + 8, "text-anchor": "middle", class: "simkit-label", style: "font-size:22px", fill: nRight ? kit.colors.blue : kit.colors.red, text: nRight ? "S" : "N" }, g);
        kit.el("text", { x: R + 26, y: o.y + 8, "text-anchor": "middle", class: "simkit-label", style: "font-size:22px", fill: nRight ? kit.colors.red : kit.colors.blue, text: nRight ? "N" : "S" }, g);
      }
      // Wires down to the battery.
      const by = o.y + 180;
      kit.el("path", { d: `M ${L + 14} ${o.y + 26} V ${by} H ${o.x - 30}`, fill: "none", stroke: COPPER, "stroke-width": 3 }, g);
      kit.el("path", { d: `M ${R - 14} ${o.y + 26} V ${by} H ${o.x + 30}`, fill: "none", stroke: COPPER, "stroke-width": 3 }, g);
      // Battery: long plate = +. The current's sign decides which side is +.
      const bat = kit.el("g", null, g);
      if (kit.linked(flip)) kit.grip(bat, o.x, by, 34);
      kit.el("rect", { x: o.x - 30, y: by - 26, width: 60, height: 52, fill: kit.colors.paper }, bat);
      const plusLeft = o.current >= 0;
      kit.el("line", { x1: o.x + (plusLeft ? -8 : 8), y1: by - 24, x2: o.x + (plusLeft ? -8 : 8), y2: by + 24, stroke: kit.colors.ink, "stroke-width": 4 }, bat);
      kit.el("line", { x1: o.x + (plusLeft ? 8 : -8), y1: by - 12, x2: o.x + (plusLeft ? 8 : -8), y2: by + 12, stroke: kit.colors.ink, "stroke-width": 8 }, bat);
      kit.click(bat, flip, () => flip(-o.current));
      kit.el("text", { x: o.x, y: by + 50, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `current ${kit.fmt(Math.abs(o.current), 1)} A` }, g);
      // Paper clips held under the right end: a hanging chain.
      const cx = R - 30;
      for (let i = 0; i < s.clips; i++) {
        kit.el("rect", { x: cx - 6, y: o.y + 24 + i * 11, width: 12, height: 16, rx: 5, fill: "none", stroke: kit.colors.steel, "stroke-width": 2 }, g);
      }
      kit.el("text", { x: R + 60, y: o.y + 60, "text-anchor": "start", class: "simkit-label", fill: kit.colors.ink, text: `holds ${s.clips} paper clip${s.clips === 1 ? "" : "s"}` }, g);
      kit.el("text", { x: R + 60, y: o.y + 88, "text-anchor": "start", class: "simkit-label", fill: kit.colors.purple, text: o.showField ? `field ${kit.fmt(s.field, s.field < 10 ? 1 : 0)} mT` : "field ? mT" }, g);
    }

    draw();

    return {
      update(next) {
        for (const key of ["turns", "current", "core"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ field: false }) writes "field ? mT" (the clips stay visible). */
      show(which) {
        if (which.field != null) o.showField = which.field;
        draw();
      },
      values: sol,
    };
  };
})();
