/* simkit.spinner: a wheel with coloured slices that can be spun, and a tally of the results. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=300, y=280 (centre), r=170, groups: [{ id, label, color, count }] (2–4 colours; count = number of
   *         equal slices of that colour), showValues=true (the tally at the right) }
   * Returns { update({ groups: { [id]: { count } } }), showValues(bool), spin({ times }) -> Promise<id of the
   *   last result>, reset() (clears the tally), stop(), values() }
   * values() -> { total (slices), p: { [id]: probability }, tally: { [id]: results so far }, spins }
   * Results are random; the probability of a colour is its slices ÷ all slices.
   */
  kit.spinner = function (stage, opts) {
    const o = Object.assign({ x: 300, y: 280, r: 170, groups: [], showValues: true }, opts);
    const g = stage.layer({ class: "simkit-spinner" });
    const palette = [kit.colors.red, kit.colors.blue, kit.colors.green, kit.colors.yellow];
    const groups = o.groups.slice(0, 4).map((gr, i) => ({ id: gr.id || `g${i + 1}`, label: gr.label || gr.id || `colour ${i + 1}`, color: gr.color || palette[i], count: gr.count == null ? 1 : gr.count, tally: 0 }));
    const wheel = kit.el("g", null, g);
    kit.el("polygon", { points: `${o.x},${o.y - o.r + 14} ${o.x - 14},${o.y - o.r - 18} ${o.x + 14},${o.y - o.r - 18}`, fill: kit.colors.ink }, g);
    const tallyG = kit.el("g", null, g);
    let rotation = 0;
    let anim = null;
    let spins = 0;

    const slices = () => groups.flatMap((gr) => Array.from({ length: kit.clamp(Math.round(gr.count), 0, 12) }, () => gr));
    const sol = () => {
      const total = slices().length;
      return { total, p: Object.fromEntries(groups.map((gr) => [gr.id, total ? kit.clamp(Math.round(gr.count), 0, 12) / total : 0])), tally: Object.fromEntries(groups.map((gr) => [gr.id, gr.tally])), spins };
    };

    function drawWheel() {
      wheel.textContent = "";
      const list = slices();
      const n = list.length;
      if (!n) return;
      // Colours alternate around the wheel so equal chances look equal.
      const order = [];
      const left = groups.map((gr) => kit.clamp(Math.round(gr.count), 0, 12));
      while (order.length < n) groups.forEach((gr, i) => left[i]-- > 0 && order.push(gr));
      order.forEach((gr, i) => {
        const a1 = (i / n) * 2 * Math.PI - Math.PI / 2;
        const a2 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
        const p = (a) => `${(o.x + o.r * Math.cos(a)).toFixed(1)} ${(o.y + o.r * Math.sin(a)).toFixed(1)}`;
        kit.el("path", { d: n === 1 ? `M ${o.x - o.r} ${o.y} a ${o.r} ${o.r} 0 1 0 ${2 * o.r} 0 a ${o.r} ${o.r} 0 1 0 ${-2 * o.r} 0` : `M ${o.x} ${o.y} L ${p(a1)} A ${o.r} ${o.r} 0 ${a2 - a1 > Math.PI ? 1 : 0} 1 ${p(a2)} Z`, fill: gr.color, stroke: "#fff", "stroke-width": 3 }, wheel);
      });
      kit.el("circle", { cx: o.x, cy: o.y, r: 12, fill: kit.colors.ink }, wheel);
      wheel._order = order;
      kit.set(wheel, { transform: `rotate(${rotation.toFixed(1)} ${o.x} ${o.y})` });
    }

    function drawTally() {
      tallyG.textContent = "";
      const lx = o.x + o.r + 70;
      kit.el("text", { x: lx, y: o.y - 70, class: "simkit-label", fill: kit.colors.ink, text: `spins: ${spins}` }, tallyG);
      groups.forEach((gr, i) => {
        const y = o.y - 30 + i * 34;
        kit.el("circle", { cx: lx + 9, cy: y - 5, r: 9, fill: gr.color }, tallyG);
        kit.el("text", { x: lx + 28, y, class: "simkit-label", fill: kit.colors.ink, text: o.showValues ? `${gr.label}: ${gr.tally}` : gr.label }, tallyG);
      });
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
    }

    // The slice under the pointer (top) for the wheel's current rotation.
    const under = () => {
      const order = wheel._order || [];
      const n = order.length;
      const turned = (((-rotation % 360) + 360) % 360) / 360;
      return order[Math.floor(turned * n) % n];
    };

    drawWheel();
    drawTally();

    return {
      update(next) {
        stop();
        let changed = false;
        if (next.groups) groups.forEach((gr) => next.groups[gr.id] && next.groups[gr.id].count != null && next.groups[gr.id].count !== gr.count && ((gr.count = next.groups[gr.id].count), (changed = true)));
        if (changed) {
          groups.forEach((gr) => (gr.tally = 0));
          spins = 0;
        }
        drawWheel();
        drawTally();
      },
      showValues(visible) {
        o.showValues = visible;
        drawTally();
      },
      values: sol,
      stop,
      reset() {
        stop();
        groups.forEach((gr) => (gr.tally = 0));
        spins = 0;
        drawTally();
      },
      /** Spin once (2 s), or `times` spins in a row (quicker each). Resolves with the id the last spin landed on. */
      spin(params) {
        stop();
        const times = kit.clamp(Math.round((params && params.times) || 1), 1, 200);
        if (!slices().length) return Promise.resolve(null);
        const per = times === 1 ? 2 : Math.max(0.05, 3 / times);
        let done = 0;
        let from = rotation;
        let to = from + 720 + Math.random() * 360;
        let lastId = null;
        anim = stage.animate(per * times, (_p, t) => {
          while (done < times && t >= (done + 1) * per) {
            rotation = to % 360;
            const hit = under();
            hit.tally++;
            spins++;
            lastId = hit.id;
            done++;
            from = rotation;
            to = from + 720 + Math.random() * 360;
            drawTally();
          }
          if (done < times) {
            const q = (t - done * per) / per;
            rotation = from + (to - from) * (1 - (1 - q) ** 3);
          }
          kit.set(wheel, { transform: `rotate(${rotation.toFixed(1)} ${o.x} ${o.y})` });
        });
        return anim.then(() => lastId);
      },
    };
  };
})();
