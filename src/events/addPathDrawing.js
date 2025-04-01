import { createListener } from "../utils/createListener.js";
import { createRandStr } from "../utils/createRandStr.js";
import { evaluateAllLayers } from "../evaluateAllLayers.js";

export function addPathDrawing(el, state) {
  const listener = createListener(el);
  let currentMoveCmd = null;

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
    return pId;
  }

  function isNearPoint(x1, y1, x2, y2, threshold = 1e-6) {
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
    const pointId = addPoint(x, y);

    // Check if we're clicking near the start point of current subpath
    if (state.currentPath && currentMoveCmd) {
      const movePoint = state.geometries.find(
        (g) => g.id === currentMoveCmd.point
      );
      const moveX = state.params[movePoint.x];
      const moveY = state.params[movePoint.y];

      if (isNearPoint(x, y, moveX, moveY)) {
        // Close the current subpath
        state.currentPath.data.push({
          cmd: "close",
        });
        // Clear current path and move command when closing
        state.currentPath = null;
        currentMoveCmd = null;
        state.currentPoint = null;
        evaluateAllLayers();
        return;
      }
    }

    if (!state.currentPath) {
      if (state.editingPath) {
        // If we're editing a path, continue with that path
        const existingPath = state.geometries.find(
          (g) => g.id === state.editingPath
        );
        if (existingPath) {
          const moveCmd = {
            cmd: "move",
            point: pointId,
          };
          currentMoveCmd = moveCmd;
          state.currentPath = existingPath;
          state.currentPath.data.push(moveCmd);
        }
      } else {
        // Start new path
        const pathId = createRandStr(4);
        const moveCmd = {
          cmd: "move",
          point: pointId,
        };
        currentMoveCmd = moveCmd;
        state.currentPath = {
          id: pathId,
          type: "path",
          data: [moveCmd],
          layer: state.activeLayer,
          attributes: {
            fill: "none",
            stroke: "black",
            strokeWidth: 2,
          },
        };
        state.geometries.push(state.currentPath);
        // Enter path editing mode for the new path
        state.editingPath = pathId;
        state.selectedGeometry = new Set();
      }
    } else {
      if (!currentMoveCmd) {
        // Start a new subpath if there's no current move command
        const moveCmd = {
          cmd: "move",
          point: pointId,
        };
        currentMoveCmd = moveCmd;
        state.currentPath.data.push(moveCmd);
      } else {
        // Add point to existing subpath
        state.currentPath.data.push({
          cmd: "line",
          point: pointId,
        });
      }
    }
    evaluateAllLayers();
  });
}
