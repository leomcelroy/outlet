import { createListener } from "../utils/createListener.js";

export function addSelectionBox(el, state, callback = null) {
  let start = null;
  let end = null;

  state.selectBox = {
    start: [0, 0],
    end: [0, 0],
  };

  const listener = createListener(el);

  function getPoint(e) {
    let rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    return el.transformPoint ? el.transformPoint([x, y]) : [x, y];
  }

  listener("mousedown", "", (e) => {
    if (!e.shiftKey) return;
    if (state.tool !== "SELECT") return;

    start = getPoint(e);
    end = getPoint(e);
  });

  listener("mousemove", "", (e) => {
    if (!e.shiftKey) {
      start = null;
      end = null;

      state.selectBox = {
        start,
        end,
      };
      return;
    }

    if (start === null) return;

    end = getPoint(e);

    const newStart = [Math.min(start[0], end[0]), Math.min(start[1], end[1])];
    const newEnd = [Math.max(start[0], end[0]), Math.max(start[1], end[1])];

    state.selectBox = {
      start: newStart,
      end: newEnd,
    };
  });

  function contains(x, y) {
    let { start, end } = state.selectBox;
    return (
      (x > start[0] && x < end[0] && y > start[1] && y < end[1]) ||
      (x > start[0] && x < end[0] && y < start[1] && y > end[1]) ||
      (x < start[0] && x > end[0] && y > start[1] && y < end[1]) ||
      (x < start[0] && x > end[0] && y < start[1] && y > end[1])
    );
  }

  function lineIntersectsBox(lineStart, lineEnd, boxStart, boxEnd) {
    // Check if either endpoint is inside the box
    if (
      contains(lineStart[0], lineStart[1]) ||
      contains(lineEnd[0], lineEnd[1])
    ) {
      return true;
    }

    // Check if line intersects with any of the box edges
    const boxEdges = [
      [boxStart, [boxEnd[0], boxStart[1]]], // top
      [[boxEnd[0], boxStart[1]], boxEnd], // right
      [boxEnd, [boxStart[0], boxEnd[1]]], // bottom
      [[boxStart[0], boxEnd[1]], boxStart], // left
    ];

    for (const [edgeStart, edgeEnd] of boxEdges) {
      if (linesIntersect(lineStart, lineEnd, edgeStart, edgeEnd)) {
        return true;
      }
    }

    return false;
  }

  function linesIntersect(p1, p2, p3, p4) {
    const denominator =
      (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
    if (denominator === 0) return false;

    const t =
      ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) /
      denominator;
    const u =
      -((p1[0] - p2[0]) * (p1[1] - p3[1]) - (p1[1] - p2[1]) * (p1[0] - p3[0])) /
      denominator;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  listener("mouseup", "", (e) => {
    if (!e.shiftKey) return;

    if (start && end) {
      const dx = start[0] - end[0];
      const dy = start[1] - end[1];
      const moved = Math.hypot(dx, dy) > 10;

      if (moved) {
        // Clear previous selection if not holding shift
        if (!e.shiftKey) {
          state.selectedGeometry = new Set();
        }

        // Select points that are inside the box
        state.geometries.forEach((geo) => {
          if (geo.type === "point") {
            const x = state.params[geo.x];
            const y = state.params[geo.y];
            if (contains(x, y)) {
              state.selectedGeometry.add(geo.id);
            }
          }
        });

        // Select edges that intersect with the box
        state.geometries.forEach((geo) => {
          if (geo.type === "edge") {
            const p1 = state.geometries.find((g) => g.id === geo.p1);
            const p2 = state.geometries.find((g) => g.id === geo.p2);
            if (p1 && p2) {
              const lineStart = [state.params[p1.x], state.params[p1.y]];
              const lineEnd = [state.params[p2.x], state.params[p2.y]];
              if (
                lineIntersectsBox(
                  lineStart,
                  lineEnd,
                  state.selectBox.start,
                  state.selectBox.end
                )
              ) {
                state.selectedGeometry.add(geo.id);
              }
            }
          }
        });

        if (callback) {
          callback({ contains, selectBox: state.selectBox });
        }
      }
    }

    start = null;
    end = null;
    state.selectBox = {
      start,
      end,
    };
  });
}
