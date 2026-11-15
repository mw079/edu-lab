/* simkit.seasons: the tilted Earth on its orbit around the Sun, with the season and day length at one latitude. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=360, y=260 (the Sun), a=250, b=110 (orbit half-widths in px), month=6 (1–12; 6 = June solstice),
   *         latitude=45 (degrees, negative = south), tilt=23.5, showValues=true }
   * The axis always leans the same way; in June the northern half leans toward the Sun.
   * Returns { update({ month, latitude, tilt }), show({ season, daylight }), showValues(bool), values() }
   * values() -> { daylight (hours), noonSun (degrees), season }   (see simkit.physics.daylight)
   */
  kit.seasons = function (stage, opts) {
    const o = Object.assign({ x: 360, y: 260, a: 250, b: 110, month: 6, latitude: 45, tilt: 23.5, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-seasons" });
    const shown = { season: o.showValues, daylight: o.showValues };
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    kit.el("ellipse", { cx: o.x, cy: o.y, rx: o.a, ry: o.b, fill: "none", stroke: kit.colors.line, "stroke-width": 2, "stroke-dasharray": "6 6" }, g);
    kit.el("circle", { cx: o.x, cy: o.y, r: 34, fill: kit.colors.yellow, stroke: kit.colors.orange, "stroke-width": 3 }, g);
    kit.el("text", { x: o.x, y: o.y + 58, "text-anchor": "middle", class: "simkit-tick", text: "Sun" }, g);
    const pos = (month) => {
      const t = (2 * Math.PI * (month - 6)) / 12;
      return { x: o.x - o.a * Math.cos(t), y: o.y + o.b * Math.sin(t) };
    };
    // The four turning points of the year, marked on the orbit.
    [[6, "June"], [9, "September"], [12, "December"], [3, "March"]].forEach(([m, name]) => {
      const p = pos(m);
      const dy = m === 9 ? 62 : m === 3 ? -52 : 0;
      const dx = m === 6 ? -58 : m === 12 ? 58 : 0;
      kit.el("text", { x: p.x + dx, y: p.y + dy + 4, "text-anchor": m === 6 ? "end" : m === 12 ? "start" : "middle", class: "simkit-tick", text: name }, g);
    });
    const earth = kit.el("g", null, g);
    const lx = o.x + o.a + 150;
    const lines = [0, 1, 2].map((i) => kit.el("text", { x: lx, y: o.y - 30 + i * 30, class: "simkit-label", fill: [kit.colors.ink, kit.colors.greenDark, kit.colors.orange][i] }, g));
    const sol = () => kit.physics.daylight(o.month, o.latitude, o.tilt);

    function draw() {
      earth.textContent = "";
      const p = pos(o.month);
      const R = 26;
      const toSun = Math.atan2(o.y - p.y, o.x - p.x);
      kit.el("circle", { cx: p.x, cy: p.y, r: R, fill: kit.colors.blueDark, stroke: kit.colors.ink, "stroke-width": 2 }, earth);
      // Day side: the half that faces the Sun.
      const nx = Math.cos(toSun + Math.PI / 2) * R;
      const ny = Math.sin(toSun + Math.PI / 2) * R;
      kit.el("path", { d: `M ${p.x + nx} ${p.y + ny} A ${R} ${R} 0 0 0 ${p.x - nx} ${p.y - ny} Z`, fill: "#8fc3f0" }, earth);
      // Axis leaning to the right by the tilt, with N at the top; equator at right angles to it.
      const t = (o.tilt * Math.PI) / 180;
      const ax = Math.sin(t);
      const ay = -Math.cos(t);
      kit.el("line", { x1: p.x - ax * (R + 14), y1: p.y - ay * (R + 14), x2: p.x + ax * (R + 14), y2: p.y + ay * (R + 14), stroke: kit.colors.red, "stroke-width": 3 }, earth);
      kit.el("line", { x1: p.x + ay * R, y1: p.y - ax * R, x2: p.x - ay * R, y2: p.y + ax * R, stroke: "#fff", "stroke-width": 2, opacity: 0.8 }, earth);
      kit.el("text", { x: p.x + ax * (R + 26), y: p.y + ay * (R + 26) + 5, "text-anchor": "middle", class: "simkit-tick", fill: kit.colors.redDark, text: "N" }, earth);
      const v = sol();
      const m = ((Math.round(o.month) - 1 + 12) % 12) + 1;
      const where = `${kit.fmt(Math.abs(o.latitude), 0)}° ${o.latitude >= 0 ? "north" : "south"}`;
      kit.set(lines[0], { text: `${names[m - 1]}, at ${where}` });
      kit.set(lines[1], { text: shown.season ? `season: ${v.season}` : "season: ?" });
      kit.set(lines[2], { text: shown.daylight ? `daylight: ${kit.fmt(v.daylight, 1)} hours` : "daylight: ? hours" });
    }

    draw();

    return {
      update(next) {
        for (const key of ["month", "latitude", "tilt"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ season: false }) or show({ daylight: false }) writes "?" for that value. */
      show(which) {
        if (which.season != null) shown.season = which.season;
        if (which.daylight != null) shown.daylight = which.daylight;
        draw();
      },
      showValues(visible) {
        shown.season = shown.daylight = visible;
        draw();
      },
      values: sol,
    };
  };
})();
