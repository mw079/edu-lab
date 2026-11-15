/* simkit.reactionBox: particles A and B that move, collide and react to AB (collision theory). */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=120, y=90, w=520, h=360, nA=12, nB=12 (particles at the start), T=300 (K), Ea=50 (kJ/mol),
   *         labelA="A", labelB="B" }
   * Particles always move (faster when hotter). They only react while run() is playing: an A and a B that
   * touch form a green AB if the collision is energetic enough (more likely at higher T and lower Ea).
   * Returns { update({ nA, nB, T, Ea }), run({ duration }) -> Promise<number of AB formed>, reset(), stop(), products() }
   * The picture is random; use simkit.physics.reactionRate for exact numbers.
   */
  kit.reactionBox = function (stage, opts) {
    const o = Object.assign({ x: 120, y: 90, w: 520, h: 360, nA: 12, nB: 12, T: 300, Ea: 50, labelA: "A", labelB: "B" }, opts);
    const g = stage.layer({ class: "simkit-reaction" });
    kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 14, fill: "#fff", stroke: kit.colors.steel, "stroke-width": 6 }, g);
    const dotsG = kit.el("g", null, g);
    // Legend with live counts, above the box.
    const legend = [
      ["A", kit.colors.red],
      ["B", kit.colors.blue],
      ["AB", kit.colors.green],
    ].map(([kind, color], i) => {
      kit.el("circle", { cx: o.x + 14 + i * 170, cy: o.y - 24, r: kind === "AB" ? 11 : 8, fill: color }, g);
      return kit.el("text", { x: o.x + 32 + i * 170, y: o.y - 19, class: "simkit-label", fill: kit.colors.ink }, g);
    });
    let particles = [];
    let reacting = false;
    let anim = null;
    const R = 8;

    function spawn() {
      dotsG.textContent = "";
      particles = [];
      const add = (kind) => {
        const a = Math.random() * Math.PI * 2;
        const p = { kind, x: R + 4 + Math.random() * (o.w - 2 * R - 8), y: R + 4 + Math.random() * (o.h - 2 * R - 8), dx: Math.cos(a), dy: Math.sin(a) };
        p.el = kit.el("circle", { r: R, fill: kind === "A" ? kit.colors.red : kit.colors.blue }, dotsG);
        particles.push(p);
      };
      for (let i = 0; i < kit.clamp(Math.round(o.nA), 0, 60); i++) add("A");
      for (let i = 0; i < kit.clamp(Math.round(o.nB), 0, 60); i++) add("B");
      labels();
    }

    const count = (kind) => particles.filter((p) => p.kind === kind).length;
    function labels() {
      kit.set(legend[0], { text: `${o.labelA}: ${count("A")}` });
      kit.set(legend[1], { text: `${o.labelB}: ${count("B")}` });
      kit.set(legend[2], { text: `${o.labelA}${o.labelB}: ${count("AB")}` });
    }

    stage.onFrame((dt) => {
      const speed = 90 * Math.sqrt(o.T / 300);
      for (const p of particles) {
        const r = (p.kind === "AB" ? 11 : R) + 4; // stay clear of the wall's thickness
        p.x += p.dx * speed * dt;
        p.y += p.dy * speed * dt;
        if (p.x < r) (p.x = r), (p.dx = Math.abs(p.dx));
        if (p.x > o.w - r) (p.x = o.w - r), (p.dx = -Math.abs(p.dx));
        if (p.y < r) (p.y = r), (p.dy = Math.abs(p.dy));
        if (p.y > o.h - r) (p.y = o.h - r), (p.dy = -Math.abs(p.dy));
      }
      if (reacting) {
        // Chance that one touching A–B pair reacts in this frame: the Arrhenius factor, scaled for the picture.
        const chance = kit.clamp(0.5 * Math.exp(((-o.Ea * 1000) / 8.314) * (1 / o.T - 1 / 300)), 0, 1);
        for (const a of particles) {
          if (a.kind !== "A") continue;
          const b = particles.find((q) => q.kind === "B" && Math.hypot(q.x - a.x, q.y - a.y) < 2 * R);
          if (b && Math.random() < chance) {
            a.kind = "AB";
            kit.set(a.el, { r: 11, fill: kit.colors.green });
            b.kind = "gone";
            b.el.remove();
          }
        }
        if (particles.some((p) => p.kind === "gone")) {
          particles = particles.filter((p) => p.kind !== "gone");
          labels();
        }
      }
      for (const p of particles) kit.set(p.el, { cx: (o.x + p.x).toFixed(1), cy: (o.y + p.y).toFixed(1) });
    });

    function stop() {
      if (anim) anim.cancel();
      anim = null;
      reacting = false;
    }

    spawn();

    return {
      update(next) {
        const restart = (next.nA != null && next.nA !== o.nA) || (next.nB != null && next.nB !== o.nB);
        Object.assign(o, Object.fromEntries(Object.entries(next).filter(([, v]) => v != null)));
        if (restart) {
          stop();
          spawn();
        }
      },
      products: () => count("AB"),
      reset() {
        stop();
        spawn();
      },
      stop,
      /** Let the particles react for `duration` seconds (default 6). Resolves with the number of AB formed. */
      run(params) {
        stop();
        spawn();
        reacting = true;
        anim = stage.animate((params && params.duration) || 6, () => {});
        return anim.then(() => {
          reacting = false;
          return count("AB");
        });
      },
    };
  };
})();
