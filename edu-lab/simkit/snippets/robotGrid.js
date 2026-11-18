// kit.robotGrid(stage, { x, y (top-left of the grid), cell, cols, rows, repeat, forward, turn (0 none, 1 left,
//   2 right), targetX, targetY (a flag on that square), showPath })
// → { update({ repeat, forward, turn, targetX, targetY }), show({ path }), run() → Promise, stop(), values() }
// The program is: repeat `repeat` times { move forward `forward` squares; turn }. The robot starts on square
// (1, 1), bottom left, facing east, on an 8 × 6 grid; x counts to the right, y counts up. It stops at a wall.
// Physics for derived values: simkit.physics.robot(repeat, forward, turn)
//   → { x, y, facing ("east" | "north" | "west" | "south"), moves (squares moved), crashed (true/false) }
//   Examples: (3, 2, 0) ends at (7, 1); (2, 3, 1) ends at (4, 4) facing west; (4, 2, 1) drives a square back to (1, 1).
// Use sliders: repeat 1–6, forward 1–4, turn 0–2 (all step 1). Check goals with d.x and d.y.
// A step whose goal is not the flag (e.g. "return to the start") should set targetX and targetY to 0: no flag is drawn.
// Always visible: the grid, the flag, the program and the robot. With show({ path: true }) the finished path and
// end square are drawn at once; with show({ path: false }) the robot waits at the start (use it in a step that
// asks where it will end) until the action runs.
// Leaves 300 px free to the right of the grid for the program.
// Direct interaction: with click: { repeat: app.link("repeat"), forward: app.link("forward"), turn: app.link("turn") }
// the student clicks a line of the program to change it.
// Example state: { repeat: 2, forward: 3, turn: 1 }   actions: [{ id: "run", label: "Run program" }]
function (stage, kit, app) {
  const robot = kit.robotGrid(stage, {
    x: 90, y: 70, targetX: 4, targetY: 4,
    click: { repeat: app.link("repeat"), forward: app.link("forward"), turn: app.link("turn") },
  });
  return {
    update(s, d, info) {
      robot.update({ repeat: s.repeat, forward: s.forward, turn: s.turn });
      robot.show({ path: info.solved || info.hidden.size === 0 });
    },
    stop() { robot.stop(); },
    run() { return robot.run(); },
  };
}
