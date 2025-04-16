import { createListener } from "../utils/createListener.js";
import { createRandStr } from "../utils/createRandStr.js";
import { evaluateAllLayers } from "../utils/evaluateAllLayers.js";

export function addEdgeDrawing(el, state) {
  const listener = createListener(el);

  state.currentPoint = null;
  state.edgeStart = null;

  function reset() {
    state.currentPoint = null;
    state.edgeStart = null;
  }

  listener("mousedown", "", (e) => {
    if (state.tool !== "DRAW") {
      reset();
      return;
    }

    const pt = getPointWithSuggestions(e);
    state.currentPoint = pt;

    const { x, y, overlap } = state.currentPoint;

    let pointId;
    if (overlap === null) {
      pointId = addPoint(x, y);
    } else {
      pointId = overlap;
    }

    if (state.edgeStart === null) {
      state.edgeStart = pointId;
    } else if (state.edgeStart === pointId) {
    } else {
      addEdge(state.edgeStart, pointId);
      evaluateAllLayers();

      // if I'm not holding shift then reset otherwise
      // if im holding shift then start a new edge from this point
      if (!e.shiftKey) {
        state.edgeStart = null;
        state.currentPoint = getPointWithSuggestions(e);
      } else {
        state.edgeStart = pointId;
      }
    }
  });

  listener("mousemove", "", (e) => {
    const [x, y] = getPoint(e);
    state.canvasX = x;
    state.canvasY = y;

    if (state.tool !== "DRAW") {
      reset();
      return;
    }

    const pt = getPointWithSuggestions(e);
    state.currentPoint = pt;
  });

  function addPoint(x, y) {
    const xId = createRandStr();
    const yId = createRandStr();
    state.params[xId] = x;
    state.params[yId] = y;

    const pId = createRandStr();
    const p = {
      id: pId,
      type: "point",
      cornerType: "straight",
      cornerValue: 0.5,
      x: xId,
      y: yId,
      layer: state.activeLayer,
    };

    state.geometries.push(p);

    return pId;
  }

  function addEdge(startId, endId) {
    const edgeId = createRandStr();
    const edge = {
      id: edgeId,
      type: "edge",
      p1: startId,
      c1: null,
      p2: endId,
      c2: null,
      layer: state.activeLayer,
    };

    // Check for existing edge by sorting the point IDs to create a consistent edge key
    const edgeKey = [startId, endId].sort().join(",");
    const existingEdge = state.geometries.find(
      (geo) =>
        geo.type === "edge" && [geo.p1, geo.p2].sort().join(",") === edgeKey
    );
    if (existingEdge) {
      return;
    }

    state.geometries.push(edge);
    return edgeId;
  }

  function getPoint(e) {
    let rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    return el.transformPoint ? el.transformPoint([x, y]) : [x, y];
  }

  function getPointWithSuggestions(e) {
    let [x, y] = getPoint(e);

    // If grid is enabled and we're not near a point, snap to grid
    if (state.grid) {
      const stepSize = state.gridSize;
      x = Math.round(x / stepSize) * stepSize;
      y = Math.round(y / stepSize) * stepSize;
    }

    const points = state.geometries
      .filter((geo) => geo.type === "point")
      .map(({ x, y, id }) => ({
        x: state.params[x],
        y: state.params[y],
        id,
      }));

    const closestPoint = findClosestPoint(points, [x, y]);

    // If we're close to a point, prioritize snapping to it
    if (
      closestPoint &&
      closestPoint.distance < 5 / (state.panZoomMethods?.scale() || 1)
    ) {
      return {
        x,
        y,
        overlap: closestPoint.id,
      };
    }

    return {
      x,
      y,
      overlap: null,
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
