import { createListener } from "../utils/createListener.js";
import { createRandStr } from "../utils/createRandStr.js";
import { evaluateAllLayers } from "../evaluateAllLayers.js";

export function addPathDrawing(el, state) {
  const listener = createListener(el);
  let startPointId = null; // Store the starting point ID

  function getPoint(e) {
    let rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    return el.transformPoint ? el.transformPoint([x, y]) : [x, y];
  }

  function getPointWithSnap(e) {
    let [x, y] = getPoint(e);

    if (state.grid) {
      const stepSize = state.gridSize;
      x = Math.round(x / stepSize) * stepSize;
      y = Math.round(y / stepSize) * stepSize;
    }

    return { x, y };
  }

  function addPoint(x, y) {
    const xId = createRandStr(4);
    const yId = createRandStr(4);
    state.params[xId] = x;
    state.params[yId] = y;

    const pId = createRandStr(4);
    const p = {
      id: pId,
      type: "point",
      x: xId,
      y: yId,
      layer: state.activeLayer,
    };

    state.geometries.push(p);
    return { pId, xId, yId };
  }

  function isNearPoint(x1, y1, x2, y2, threshold = 10) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  listener("mousemove", "", (e) => {
    if (state.tool !== "DRAW_PATH") return;

    const pt = getPointWithSnap(e);
    state.currentPoint = pt;
  });

  listener("mousedown", "", (e) => {
    if (state.tool !== "DRAW_PATH") return;

    const { x, y } = getPointWithSnap(e);

    // Check if we're clicking near the start point
    if (state.currentPath && startPointId) {
      const startPoint = state.geometries.find((g) => g.id === startPointId);
      const startX = state.params[startPoint.x];
      const startY = state.params[startPoint.y];

      if (isNearPoint(x, y, startX, startY)) {
        // Close the path
        state.currentPath.data.push({
          cmd: "close",
        });
        state.currentPath = null;
        state.currentPoint = null;
        startPointId = null;
        evaluateAllLayers();
        return;
      }
    }

    const { pId, xId, yId } = addPoint(x, y);

    if (!state.currentPath) {
      // Start new path
      const pathId = createRandStr(4);
      startPointId = pId; // Store the starting point ID
      state.currentPath = {
        id: pathId,
        type: "path",
        data: [
          {
            cmd: "start",
            x: xId,
            y: yId,
          },
        ],
        layer: state.activeLayer,
        attributes: {
          fill: "none",
          stroke: "black",
          strokeWidth: 2,
        },
      };
      state.geometries.push(state.currentPath);
    } else {
      // Add point to existing path
      state.currentPath.data.push({
        cmd: "line",
        x: xId,
        y: yId,
      });
    }
    evaluateAllLayers();
  });

  window.addEventListener("keydown", (e) => {
    if (state.tool !== "DRAW_PATH") return;

    if (e.key === "Enter" && state.currentPath) {
      // Path is already in geometries, just need to clean up
      state.currentPath = null;
      state.currentPoint = null;
      evaluateAllLayers();
    } else if (e.key === "Escape") {
      // Remove the current path from geometries
      if (state.currentPath) {
        state.geometries = state.geometries.filter(
          (g) => g.id !== state.currentPath.id
        );
      }
      state.currentPath = null;
      state.currentPoint = null;
      evaluateAllLayers();
    }
  });
}
