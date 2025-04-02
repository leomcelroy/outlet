import { deleteGeometry } from "../utils/deleteGeometry.js";

export function addHotKeys(state) {
  window.addEventListener("keydown", (e) => {
    if (e.key === "d") {
      state.currentPoint = null;
      state.edgeStart = null;
      state.selectedGeometry = new Set();
      state.dispatch({ type: "SET_TOOL", tool: "DRAW" });
    }

    if (e.key === "s") {
      clearEdgeStartIfNoConnections(state);
      state.currentPoint = null;
      state.selectedGeometry = new Set();
      state.dispatch({ type: "SET_TOOL", tool: "SELECT" });
    }

    if (e.key === "Escape") {
      clearEdgeStartIfNoConnections(state);
      state.currentPoint = null;
      state.edgeStart = null;
      state.selectedGeometry = new Set();
    }

    if (e.key === "Backspace") {
      deleteGeometry(state);
    }
  });
}

function clearEdgeStartIfNoConnections(state) {
  if (state.edgeStart) {
    const hasConnectedEdges = state.geometries.some(
      (geo) =>
        geo.type === "edge" &&
        (geo.p1 === state.edgeStart || geo.p2 === state.edgeStart)
    );
    if (!hasConnectedEdges) {
      // Find and remove the point at edgeStart
      const pointIndex = state.geometries.findIndex(
        (geo) => geo.type === "point" && geo.id === state.edgeStart
      );
      if (pointIndex !== -1) {
        state.geometries.splice(pointIndex, 1);
      }
      state.edgeStart = null;
    }
  }
}
