/* simkit.transformShape: a shape and its image after a translation, reflection, rotation or enlargement. */
(function () {
  "use strict";
  const kit = window.simkit;
  const U = 24; // px per grid unit

  /**
   * opts: { x=40, y=40 (top left), kind=0 (0 translation, 1 reflection, 2 rotation, 3 enlargement),
   *         dx=3, dy=2 (translation), mirror=0 (reflection in 0 the x-axis, 1 the y-axis, 2 the line y = x),
   *         turn=90 (rotation, degrees anticlockwise about the origin: 90, 180 or 270), scale=2 (enlargement about the
   *         origin, −2…3), shape=[[1,1],[3,1],[1,3]] (vertices A, B, C… on the grid), showImage=true,
   *         drag: { dx: app.link("key"), dy: app.link("key") } (translation: the student drags the image) }
   * Grid from −10 to 10 across and −9 to 9 up. Keep the image on the grid (e.g. |dx|, |dy| ≤ 6 for the default shape).
   * Returns { update({ kind, dx, dy, mirror, turn, scale, shape }), show({ image }), values() }
   * values() -> { image: [[x, y], …], description }   (see simkit.physics.transform)
   */
  kit.transformShape = function (stage, opts) {
    const o = Object.assign({ x: 40, y: 40, kind: 0, dx: 3, dy: 2, mirror: 0, turn: 90, scale: 2, shape: [[1, 1], [3, 1], [1, 3]], showImage: true }, opts);
    const g = stage.layer({ class: "simkit-transform" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const ox = o.x + 260;
    const oy = o.y + 240;
    const px = ([gx, gy]) => [ox + gx * U, oy - gy * U];
    const links = o.drag ? [o.drag.dx, o.drag.dy].filter((l) => typeof l === "function") : [];
    const dragger = kit.drag(
      stage,
      handle,
      links,
      (p, start, data) => {
        if (o.drag.dx) o.drag.dx(kit.clamp(data.dx + (p.x - start.x) / U, -9, 9));
        if (o.drag.dy) o.drag.dy(kit.clamp(data.dy - (p.y - start.y) / U, -9, 9));
      },
      () => ({ dx: o.dx, dy: o.dy })
    );
    const args = () => [[o.dx, o.dy], [o.mirror], [o.turn], [o.scale]][kit.clamp(Math.round(o.kind), 0, 3)];
    const describe = () =>
      [
        `Translation by (${kit.fmt(o.dx, 0)}, ${kit.fmt(o.dy, 0)})`,
        `Reflection in the ${["x-axis", "y-axis", "line y = x"][kit.clamp(Math.round(o.mirror), 0, 2)]}`,
        `Rotation ${kit.fmt(o.turn, 0)}° anticlockwise about (0, 0)`,
        `Enlargement, scale factor ${kit.fmt(o.scale, Number.isInteger(o.scale) ? 0 : 1)}, centre (0, 0)`,
      ][kit.clamp(Math.round(o.kind), 0, 3)];
    const sol = () => ({ image: kit.physics.transform(o.shape, o.kind, ...args()), description: describe() });

    function poly(points, fill, stroke, parent) {
      return kit.el("polygon", { points: points.map((p) => px(p).join(",")).join(" "), fill, "fill-opacity": 0.45, stroke, "stroke-width": 3, "stroke-linejoin": "round" }, parent);
    }

    function draw() {
      pic.textContent = "";
      handle.textContent = "";
      const s = sol();
      // Grid and axes.
      for (let gx = -10; gx <= 10; gx++) kit.el("line", { x1: ox + gx * U, y1: oy - 9 * U, x2: ox + gx * U, y2: oy + 9 * U, stroke: gx ? "#e3e0d9" : kit.colors.ink, "stroke-width": gx ? 1 : 2 }, pic);
      for (let gy = -9; gy <= 9; gy++) kit.el("line", { x1: ox - 10 * U, y1: oy - gy * U, x2: ox + 10 * U, y2: oy - gy * U, stroke: gy ? "#e3e0d9" : kit.colors.ink, "stroke-width": gy ? 1 : 2 }, pic);
      for (let v = -10; v <= 10; v += 2) if (v) kit.el("text", { x: ox + v * U, y: oy + 18, "text-anchor": "middle", class: "simkit-tick", style: "font-size:12px", text: String(v) }, pic);
      for (let v = -8; v <= 8; v += 2) if (v) kit.el("text", { x: ox - 6, y: oy - v * U + 4, "text-anchor": "end", class: "simkit-tick", style: "font-size:12px", text: String(v) }, pic);
      // Helpers that show the transformation.
      const kind = kit.clamp(Math.round(o.kind), 0, 3);
      const guide = { stroke: kit.colors.purple, "stroke-width": 2, "stroke-dasharray": "6 5" };
      if (kind === 1) {
        const m = kit.clamp(Math.round(o.mirror), 0, 2);
        const ends = m === 0 ? [[-10, 0], [10, 0]] : m === 1 ? [[0, -9], [0, 9]] : [[-9, -9], [9, 9]];
        const [a, b] = ends.map(px);
        kit.el("line", Object.assign({ x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, guide), pic);
      }
      if (kind === 2 || kind === 3) kit.el("circle", { cx: ox, cy: oy, r: 6, fill: kit.colors.purple }, pic);
      if (kind === 3 && o.showImage) {
        for (const p of s.image) {
          const [ex, ey] = px(p);
          kit.el("line", Object.assign({ x1: ox, y1: oy, x2: ex, y2: ey }, guide, { "stroke-width": 1.5 }), pic);
        }
      }
      // Shape (blue) and image (red).
      poly(o.shape, kit.colors.blue, kit.colors.blueDark, pic);
      const [ax, ay] = px(o.shape[0]);
      kit.el("circle", { cx: ax, cy: ay, r: 5, fill: kit.colors.blueDark }, pic);
      if (o.showImage) {
        poly(s.image, kit.colors.red, kit.colors.redDark, handle);
        const [ix, iy] = px(s.image[0]);
        if (kit.linked(links[0]) && kind === 0) kit.grip(handle, ix, iy, 22);
        kit.el("circle", { cx: ix, cy: iy, r: 5, fill: kit.colors.redDark }, handle);
      }
      dragger.refresh();
      // Description and coordinates at the right.
      const lx = o.x + 540;
      kit.el("text", { x: lx, y: o.y + 40, class: "simkit-label", fill: kit.colors.ink, text: s.description }, pic);
      kit.el("text", { x: lx, y: o.y + 76, class: "simkit-tick", text: "shape (blue)  →  image (red)" }, pic);
      const fmt = (p) => `(${kit.fmt(p[0], Number.isInteger(p[0]) ? 0 : 1)}, ${kit.fmt(p[1], Number.isInteger(p[1]) ? 0 : 1)})`;
      o.shape.forEach((p, i) => {
        const name = String.fromCharCode(65 + i);
        kit.el("text", { x: lx, y: o.y + 116 + i * 32, class: "simkit-label", fill: kit.colors.blueDark, text: `${name} ${fmt(p)}` }, pic);
        kit.el("text", { x: lx + 150, y: o.y + 116 + i * 32, class: "simkit-label", fill: kit.colors.redDark, text: o.showImage ? `${name}′ ${fmt(s.image[i])}` : `${name}′ (?, ?)` }, pic);
      });
      kit.el("text", { x: lx, y: o.y + 132 + o.shape.length * 32, class: "simkit-tick", text: "dots mark A and A′" }, pic);
    }

    draw();

    return {
      update(next) {
        for (const key of ["kind", "dx", "dy", "mirror", "turn", "scale", "shape"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ image: false }) removes the image and writes "(?, ?)" for its corners. */
      show(which) {
        if (which.image != null) o.showImage = which.image;
        draw();
      },
      values: sol,
    };
  };
})();
