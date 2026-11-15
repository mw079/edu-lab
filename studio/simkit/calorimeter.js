/* simkit.calorimeter: a hot (or cold) metal block dropped into water in an insulated cup. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=330, y=190 (top-left of the cup), w=260, h=260, mWater=200 (g), tWater=20 (°C), mBlock=100 (g),
   *         cBlock=0.39 (J/(g·°C)), tBlock=100 (°C), metal="copper", showValues=true }
   * The thermometer in the water reads tWater until drop() is played, then moves to the final temperature.
   * Returns { update({ mWater, tWater, mBlock, cBlock, tBlock, metal }), show({ thermometer }), showValues(bool),
   *   drop() -> Promise, reset(), stop(), values() }
   * values() -> { final (°C), heat (J) }   (see simkit.physics.mixTemp; water has c = 4.18)
   */
  kit.calorimeter = function (stage, opts) {
    const o = Object.assign({ x: 330, y: 190, w: 260, h: 260, mWater: 200, tWater: 20, mBlock: 100, cBlock: 0.39, tBlock: 100, metal: "copper", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-calorimeter" });
    let showThermo = true;
    let anim = null;
    let progress = 0; // 0 = block above the water, 1 = mixed
    const sol = () => kit.physics.mixTemp(o.mWater, 4.18, o.tWater, o.mBlock, o.cBlock, o.tBlock);
    const surface = o.y + 60;
    // Insulated cup: thick wall, water inside.
    kit.el("rect", { x: o.x - 14, y: o.y, width: o.w + 28, height: o.h + 14, rx: 14, fill: "#e6e2d8", stroke: kit.colors.steel, "stroke-width": 3 }, g);
    const water = kit.el("rect", { x: o.x, y: surface, width: o.w, height: o.y + o.h - surface, rx: 6 }, g);
    const waterLabel = kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 44, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.blueDark }, g);
    const dynamic = kit.el("g", null, g);
    // Thermometer at the right of the cup with a 0–100 °C scale.
    const tx = o.x + o.w + 90;
    const tTop = o.y - 90;
    const tBottom = o.y + o.h - 10;
    const TY = (T) => tBottom - (kit.clamp(T, 0, 100) / 100) * (tBottom - tTop);
    kit.el("rect", { x: tx - 8, y: tTop - 10, width: 16, height: tBottom - tTop + 20, rx: 8, fill: "#fff", stroke: kit.colors.steel, "stroke-width": 2 }, g);
    kit.el("circle", { cx: tx, cy: tBottom + 18, r: 14, fill: kit.colors.red, stroke: kit.colors.steel, "stroke-width": 2 }, g);
    for (let T = 0; T <= 100; T += 20) {
      kit.el("line", { x1: tx + 8, y1: TY(T), x2: tx + 18, y2: TY(T), stroke: kit.colors.ink, "stroke-width": 2 }, g);
      kit.el("text", { x: tx + 24, y: TY(T) + 4, class: "simkit-tick", text: `${T} °C` }, g);
    }
    const mercury = kit.el("rect", { x: tx - 4, width: 8, fill: kit.colors.red }, g);
    const reading = kit.el("text", { x: tx, y: tTop - 22, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.redDark }, g);

    function draw() {
      dynamic.textContent = "";
      const v = sol();
      const T = o.tWater + (v.final - o.tWater) * progress;
      // Water colour: blue when cold, turning red as it warms.
      const w = kit.clamp(T, 0, 100) / 100;
      kit.set(water, { fill: `rgb(${Math.round(143 + 97 * w)}, ${Math.round(195 - 45 * w)}, ${Math.round(240 - 97 * w)})`, "fill-opacity": 0.8 });
      kit.set(waterLabel, { text: o.showValues ? `water: ${kit.fmt(o.mWater, 0)} g` : "water" });
      const size = kit.clamp(30 + 4 * Math.sqrt(o.mBlock), 40, 110);
      const cx = o.x + o.w / 2;
      const startTop = o.y - 60 - size;
      const endTop = o.y + o.h - 12 - size;
      const top = startTop + (endTop - startTop) * Math.min(1, progress * 2.5);
      const bT = o.tBlock + (v.final - o.tBlock) * progress;
      kit.el("line", { x1: cx, y1: o.y - 150, x2: cx, y2: top, stroke: kit.colors.ink, "stroke-width": 2 }, dynamic);
      kit.el("rect", { x: cx - size / 2, y: top, width: size, height: size, rx: 4, fill: `hsl(${Math.round(30 - 0.3 * kit.clamp(bT, 0, 100))}, 60%, ${Math.round(62 - 0.12 * kit.clamp(bT, 0, 100))}%)`, stroke: kit.colors.ink, "stroke-width": 2 }, dynamic);
      kit.el("text", { x: o.x - 30, y: o.y - 90, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink, text: o.showValues ? `${o.metal}: ${kit.fmt(o.mBlock, 0)} g` : o.metal }, dynamic);
      kit.el("text", { x: o.x - 30, y: o.y - 66, "text-anchor": "end", class: "simkit-label", fill: kit.colors.redDark, text: o.showValues && progress === 0 ? `starts at ${kit.fmt(o.tBlock, 0)} °C` : "" }, dynamic);
      // A hidden thermometer still shows the water's starting temperature, but not what happens after the drop.
      const read = showThermo ? T : o.tWater;
      kit.set(mercury, { y: TY(read), height: tBottom - TY(read) + 8, opacity: showThermo || progress === 0 ? 1 : 0.35 });
      kit.set(reading, { text: showThermo || progress === 0 ? `${kit.fmt(read, 1)} °C` : "? °C" });
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
    }

    draw();

    return {
      update(next) {
        stop();
        for (const key of ["mWater", "tWater", "mBlock", "cBlock", "tBlock", "metal"]) if (next[key] != null) o[key] = next[key];
        progress = 0;
        draw();
      },
      /** show({ thermometer: false }): the thermometer stays at the starting temperature and reads "? °C" after the drop. */
      show(which) {
        if (which.thermometer != null) showThermo = which.thermometer;
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      values: sol,
      stop,
      reset() {
        stop();
        progress = 0;
        draw();
      },
      drop() {
        stop();
        progress = 0;
        anim = stage.animate(3, (p) => {
          progress = p;
          draw();
        });
        return anim;
      },
    };
  };
})();
