/* simkit.enzyme: an enzyme and its substrate, and the reaction rate against temperature or pH. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=40, y=40 (top left), temp=37 (°C, 0–80), pH=7 (1–13), bestTemp=37, bestPH=7,
   *         axis="temp" ("temp": rate against temperature at this pH; "pH": rate against pH at this temperature),
   *         showRate=true,
   *         drag: { temp: app.link("key"), pH: app.link("key") } (the student drags the marker along the graph's axis;
   *         the link for the axis shown is used) }
   * Left: the enzyme with its active site and the substrate (it no longer fits once the enzyme is denatured).
   * Right: rate (% of the best rate) against temperature or pH, with the current value marked.
   * Returns { update({ temp, pH, bestTemp, bestPH, axis }), show({ rate }), values() }
   * values() -> { rate (%), denatured, tempFactor, pHFactor }   (see simkit.physics.enzyme)
   */
  kit.enzyme = function (stage, opts) {
    const o = Object.assign({ x: 40, y: 40, temp: 37, pH: 7, bestTemp: 37, bestPH: 7, axis: "temp", showRate: true }, opts);
    const g = stage.layer({ class: "simkit-enzyme" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const X0 = o.x + 400;
    const Y0 = o.y + 360;
    const W = 480;
    const H = 280;
    // The graph's axis: temperature 0–80 °C or pH 0–14.
    const AXES = {
      temp: { max: 80, step: 20, key: "temp", best: "bestTemp", title: "temperature (°C)", name: (v) => `best ${v} °C` },
      pH: { max: 14, step: 2, key: "pH", best: "bestPH", title: "pH", name: (v) => `best pH ${v}` },
    };
    const ax = () => AXES[o.axis === "pH" ? "pH" : "temp"];
    const xOf = (v) => X0 + (kit.clamp(v, 0, ax().max) / ax().max) * W;
    const yR = (r) => Y0 - (kit.clamp(r, 0, 100) / 100) * H;
    const links = o.drag ? [o.drag.temp, o.drag.pH].filter((l) => typeof l === "function") : [];
    const dragger = kit.drag(stage, handle, links, (p) => {
      const link = o.drag[ax().key];
      if (link) link(kit.clamp(((p.x - X0) / W) * ax().max, 0, ax().max));
    });
    const sol = () => kit.physics.enzyme(o.temp, o.pH, o.bestTemp, o.bestPH);
    const rateAt = (v) => (ax().key === "pH" ? kit.physics.enzyme(o.temp, v, o.bestTemp, o.bestPH) : kit.physics.enzyme(v, o.pH, o.bestTemp, o.bestPH)).rate;

    function enzymePicture(s) {
      const cx = o.x + 150;
      const cy = o.y + 190;
      // Enzyme: a round protein with a wedge-shaped active site on its right. Denatured, the site is squashed shut.
      const site = s.denatured ? 8 : 34;
      const d = `M ${cx + 82} ${cy - site} L ${cx + 30} ${cy} L ${cx + 82} ${cy + site} A 90 90 0 1 1 ${cx + 82} ${cy - site} Z`;
      kit.el("path", { d, fill: "#cfe3d6", stroke: kit.colors.greenDark, "stroke-width": 3, "stroke-linejoin": "round" }, pic);
      kit.el("text", { x: cx - 20, y: cy + 6, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.greenDark, text: "enzyme" }, pic);
      // Substrate: a wedge that fits the active site; it sits in the site while the enzyme works.
      const sx = s.denatured ? cx + 120 : cx + 36;
      const sy = cy;
      kit.el("path", { d: `M ${sx} ${sy} L ${sx + 52} ${sy - 32} L ${sx + 52} ${sy + 32} Z`, fill: kit.colors.orange, stroke: "#a85a12", "stroke-width": 2, "stroke-linejoin": "round" }, pic);
      kit.el("text", { x: sx + 62, y: sy + 5, class: "simkit-tick", text: "substrate" }, pic);
      kit.el("text", { x: o.x + 20, y: o.y + 360, class: "simkit-label", fill: s.denatured ? kit.colors.red : kit.colors.greenDark, text: s.denatured ? "denatured: active site changed" : "the substrate fits the active site" }, pic);
      kit.el("text", { x: o.x + 20, y: o.y + 388, class: "simkit-tick", text: `${kit.fmt(o.temp, 0)} °C · pH ${kit.fmt(o.pH, 1)}` }, pic);
    }

    function graph(s) {
      const a = ax();
      kit.el("line", { x1: X0, y1: Y0, x2: X0 + W, y2: Y0, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      kit.el("line", { x1: X0, y1: Y0, x2: X0, y2: Y0 - H, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      for (let v = 0; v <= a.max; v += a.step) kit.el("text", { x: xOf(v), y: Y0 + 22, "text-anchor": "middle", class: "simkit-tick", text: String(v) }, pic);
      for (let r = 0; r <= 100; r += 50) kit.el("text", { x: X0 - 10, y: yR(r) + 5, "text-anchor": "end", class: "simkit-tick", text: String(r) }, pic);
      kit.el("text", { x: X0 + W / 2, y: Y0 + 48, "text-anchor": "middle", class: "simkit-tick", text: a.title }, pic);
      kit.el("text", { x: X0 - 40, y: Y0 - H - 38, class: "simkit-tick", text: `rate (% of the best rate) at ${a.key === "pH" ? `${kit.fmt(o.temp, 0)} °C` : `pH ${kit.fmt(o.pH, 1)}`}` }, pic);
      if (!o.showRate) {
        kit.el("text", { x: xOf(o[a.key]) + 14, y: Y0 - 40, class: "simkit-label", fill: kit.colors.ink, text: "rate ?" }, pic);
        return;
      }
      let d = "";
      for (let i = 0; i <= 160; i++) {
        const v = (a.max * i) / 160;
        d += `${i ? "L" : "M"} ${xOf(v).toFixed(1)} ${yR(rateAt(v)).toFixed(1)} `;
      }
      kit.el("path", { d, fill: "none", stroke: kit.colors.green, "stroke-width": 3 }, pic);
      const best = o[a.best];
      kit.el("line", { x1: xOf(best), y1: Y0, x2: xOf(best), y2: Y0 - H, stroke: kit.colors.muted, "stroke-width": 1.5, "stroke-dasharray": "5 5" }, pic);
      kit.el("text", { x: xOf(best), y: Y0 - H - 14, "text-anchor": "middle", class: "simkit-tick", text: a.name(kit.fmt(best, 0)) }, pic);
      const px = xOf(o[a.key]);
      const py = yR(s.rate);
      kit.el("circle", { cx: px, cy: py, r: 7, fill: kit.colors.red, stroke: "#fff", "stroke-width": 2 }, pic);
      // On the empty side of the curve: up-left while it rises, up-right once it falls; near the top (where the
      // "best" label is) below-left instead.
      const nearTop = s.rate > 80;
      // Keep it off the y-axis at the left edge and inside the graph at the right edge.
      const right = (o[a.key] > best || px < X0 + 110) && px < X0 + W - 110;
      // Near the top the label sits further out, where the curve has already dropped well below it.
      const dx = nearTop ? 40 : 14;
      kit.el("text", { x: px + (right ? dx : -dx), y: nearTop ? py + 30 : py - 12, "text-anchor": right ? "start" : "end", class: "simkit-label", fill: kit.colors.red, text: `rate ${kit.fmt(s.rate, 0)}%` }, pic);
    }

    function draw() {
      pic.textContent = "";
      handle.textContent = "";
      const s = sol();
      enzymePicture(s);
      graph(s);
      // Marker on the axis for the current temperature or pH (grabbable while its link is on).
      const px = xOf(o[ax().key]);
      if (kit.linked(o.drag && o.drag[ax().key])) kit.grip(handle, px, Y0, 22);
      else kit.el("circle", { cx: px, cy: Y0, r: 22, fill: "#fff", "fill-opacity": 0.01 }, handle);
      kit.el("path", { d: `M ${px} ${Y0 - 2} l -9 14 h 18 z`, fill: kit.colors.ink }, handle);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["temp", "pH", "bestTemp", "bestPH", "axis"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ rate: false }) removes the curve and the point and writes "rate ?". */
      show(which) {
        if (which.rate != null) o.showRate = which.rate;
        draw();
      },
      values: sol,
    };
  };
})();
