/* simkit.photoelectric: light on a metal plate in a vacuum tube; electrons leave if the photons have enough energy. */
(function () {
  "use strict";
  const kit = window.simkit;

  // Rough colour of visible light; ultraviolet and infrared are drawn pale violet and dark red.
  function lightColor(nm) {
    if (nm < 380) return "#b9a2f0";
    if (nm > 750) return "#8c2f2f";
    const hue = nm < 440 ? 270 - ((nm - 380) / 60) * 30 : nm < 490 ? 240 - ((nm - 440) / 50) * 60 : nm < 510 ? 180 - ((nm - 490) / 20) * 60 : nm < 580 ? 120 - ((nm - 510) / 70) * 60 : nm < 645 ? 60 - ((nm - 580) / 65) * 60 : 0;
    return `hsl(${Math.round(hue)}, 85%, 55%)`;
  }

  /**
   * opts: { x=200, y=150, w=600, h=280 (the tube), wavelength=400 (nm), intensity=50 (%), work=2.3 (eV, work
   *         function of the metal), metal="sodium", showValues=true (wavelength label) }
   * Electrons leave the plate only if the photon energy is above the work function; they are faster for
   * shorter wavelengths and more numerous for brighter light.
   * Returns { update({ wavelength, intensity, work, metal }), showValues(bool), values() }
   * values() -> { photonEV, emitted, keEV, stopV, thresholdNm }   (see simkit.physics.photoelectric)
   */
  kit.photoelectric = function (stage, opts) {
    const o = Object.assign({ x: 200, y: 150, w: 600, h: 280, wavelength: 400, intensity: 50, work: 2.3, metal: "sodium", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-photoelectric" });
    const plateX = o.x + 50;
    const endX = o.x + o.w - 50;
    const midY = o.y + o.h / 2;
    const lamp = { x: o.x + 250, y: o.y - 70 };
    const beam = kit.el("polygon", { points: `${lamp.x - 18},${lamp.y + 16} ${lamp.x + 18},${lamp.y + 16} ${plateX + 14},${midY + 80} ${plateX + 14},${midY - 80}` }, g);
    kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 40, fill: "#fff", "fill-opacity": 0.35, stroke: kit.colors.steel, "stroke-width": 5 }, g);
    kit.el("rect", { x: lamp.x - 34, y: lamp.y - 26, width: 68, height: 42, rx: 8, fill: kit.colors.steel }, g);
    const lampLabel = kit.el("text", { x: lamp.x + 48, y: lamp.y + 2, class: "simkit-label", fill: kit.colors.ink }, g);
    kit.el("rect", { x: plateX - 14, y: midY - 96, width: 28, height: 192, rx: 4, fill: "#b9bfc6", stroke: kit.colors.ink, "stroke-width": 2 }, g);
    kit.el("rect", { x: endX - 8, y: midY - 96, width: 16, height: 192, rx: 4, fill: "#b9bfc6", stroke: kit.colors.ink, "stroke-width": 2 }, g);
    const metalLabel = kit.el("text", { x: plateX, y: o.y + o.h + 30, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink }, g);
    kit.el("text", { x: endX, y: o.y + o.h + 30, "text-anchor": "middle", class: "simkit-tick", text: "collector" }, g);
    const dotsG = kit.el("g", null, g);
    const sol = () => kit.physics.photoelectric(o.wavelength, o.work);
    let electrons = [];
    let due = 0;

    function draw() {
      kit.set(beam, { fill: lightColor(o.wavelength), opacity: 0.12 + 0.5 * kit.clamp(o.intensity / 100, 0, 1) });
      const band = o.wavelength < 380 ? " (ultraviolet)" : o.wavelength > 750 ? " (infrared)" : "";
      kit.set(lampLabel, { text: o.showValues ? `λ = ${kit.fmt(o.wavelength, 0)} nm${band}` : "lamp" });
      kit.set(metalLabel, { text: o.metal });
    }

    stage.onFrame((dt) => {
      const v = sol();
      if (v.emitted && o.intensity > 0) {
        due += (o.intensity / 100) * 9 * dt;
        while (due >= 1 && electrons.length < 60) {
          due -= 1;
          electrons.push({ x: plateX + 22, y: midY - 80 + Math.random() * 160, el: kit.el("circle", { r: 6, fill: kit.colors.blue, stroke: "#fff", "stroke-width": 1.5 }, dotsG) });
        }
      } else due = 0;
      const speed = 70 + 150 * Math.sqrt(v.keEV);
      for (const e of electrons) {
        e.x += speed * dt;
        kit.set(e.el, { cx: e.x.toFixed(1), cy: e.y.toFixed(1) });
        if (e.x > endX - 16) e.el.remove();
      }
      electrons = electrons.filter((e) => e.x <= endX - 16);
    });

    draw();

    return {
      update(next) {
        // Electrons already in flight belong to the old settings; start the stream again when they change.
        if (["wavelength", "intensity", "work"].some((key) => next[key] != null && next[key] !== o[key])) {
          electrons.forEach((e) => e.el.remove());
          electrons = [];
          due = 0;
        }
        for (const key of ["wavelength", "intensity", "work", "metal"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      values: sol,
    };
  };
})();
