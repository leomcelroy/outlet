import { createListener } from "../utils/createListener.js";
import { createRandStr } from "../utils/createRandStr.js";

export function addSketching(el, state) {
  const listener = createListener(el);

  let currentPoint = null;
  let lineStart = null;

  function reset() {
    lineStart = null;
    state.currentPoint = null;
    state.lineStart = null;
  }

  listener("mousedown", "", (e) => {
    if (state.tool !== "DRAW") {
      reset();
      return;
    }
    if (currentPoint === null) return;

    const { x, y, overlap } = currentPoint;

    let pointId;
    if (overlap === null) {
      pointId = addPoint(x, y);
    } else {
      pointId = overlap;
    }

    if (lineStart === null) {
      lineStart = pointId;
      state.lineStart = lineStart;
    } else {
      addLine(lineStart, pointId);
      reset();
    }
  });

  listener("mousemove", "", (e) => {
    if (state.tool !== "DRAW") {
      reset();
      return;
    }

    const pt = getPointWithSuggestions(e);
    currentPoint = pt;
    state.currentPoint = pt;
  });

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
    };

    state.geometries.push(p);

    return pId;
  }

  function addLine(startId, endId) {
    const lineId = createRandStr(4);
    const line = {
      id: lineId,
      type: "line",
      p1: startId,
      p2: endId,
    };

    state.geometries.push(line);
    return lineId;
  }

  function getPoint(e) {
    let rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    return el.transformPoint ? el.transformPoint([x, y]) : [x, y];
  }

  function getPointWithSuggestions(e) {
    let [x, y] = getPoint(e);

    const points = state.geometries
      .filter((geo) => geo.type === "point")
      .map(({ x, y, id }) => ({
        x: state.params[x],
        y: state.params[y],
        id,
      }));

    const closestPoint = findClosestPoint(points, [x, y]);

    return {
      x,
      y,
      overlap:
        closestPoint && closestPoint.distance < 5 ? closestPoint.id : null,
    };
  }
}

function findClosestPoint(points, newPoint) {
  let closestPoint = null;
  let closestDistance = Infinity;

  points.forEach((pt) => {
    const { x, y, id } = pt;
    const dist = distanceBetweenPoints([x, y], newPoint);
    if (dist < closestDistance) {
      closestPoint = {
        x,
        y,
        id,
        distance: dist,
      };
      closestDistance = dist;
    }
  });

  return closestPoint;
}

function distanceBetweenPoints(p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy);
}
