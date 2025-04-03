import { deleteGeometry } from "../utils/deleteGeometry.js";
import { clearEdgeStartIfNoConnections } from "../utils/clearEdgeStartIfNoConnections.js";
import { createRandStr } from "../utils/createRandStr.js";

export function addHotKeys(state) {
  window.addEventListener("keydown", (e) => {
    // Don't trigger hotkeys if we're typing in an input element
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      return;
    }

    if (e.key === "d") {
      state.dispatch({ type: "SET_TOOL", tool: "DRAW" });
    }

    if (e.key === "s") {
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

    // Copy selected geometry
    if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
      const selectedGeometries = Array.from(state.selectedGeometry);
      if (selectedGeometries.length > 0) {
        // Get all points that are selected
        const selectedPoints = state.geometries.filter(
          (geo) => geo.type === "point" && selectedGeometries.includes(geo.id)
        );

        // Get all edges that connect these points
        const connectingEdges = state.geometries.filter(
          (geo) =>
            geo.type === "edge" &&
            selectedPoints.some((p) => p.id === geo.p1) &&
            selectedPoints.some((p) => p.id === geo.p2)
        );

        // Combine points and their connecting edges
        const geometriesToCopy = [...selectedPoints, ...connectingEdges];

        // Create a deep copy of the geometries
        state.clipboard = JSON.parse(JSON.stringify(geometriesToCopy));
      }
    }

    // Paste copied geometry
    if (e.key === "v" && (e.metaKey || e.ctrlKey) && state.clipboard) {
      console.log("pasting", state.clipboard);
      // Create new IDs for all parameters and geometries
      const idMap = new Map(); // Map old IDs to new IDs

      // First, create new parameters for all points
      state.clipboard.forEach((geo) => {
        if (geo.type === "point") {
          const newXId = `x${createRandStr(4)}`;
          const newYId = `y${createRandStr(4)}`;

          // Store the old parameter IDs and their new values
          idMap.set(geo.x, newXId);
          idMap.set(geo.y, newYId);

          // Add new parameters to state
          state.params[newXId] = state.params[geo.x];
          state.params[newYId] = state.params[geo.y];
        }
      });

      // Then create new geometries with new IDs
      state.clipboard.forEach((geo) => {
        const newGeo = { ...geo };
        newGeo.id = `geo${createRandStr(4)}`;
        idMap.set(geo.id, newGeo.id);
        newGeo.layer = state.activeLayer; // Set the layer to current active layer

        if (geo.type === "point") {
          newGeo.x = idMap.get(geo.x);
          newGeo.y = idMap.get(geo.y);
        } else if (geo.type === "edge") {
          // For edges, update the point references
          newGeo.p1 = idMap.get(geo.p1);
          newGeo.p2 = idMap.get(geo.p2);
        }

        // Add the new geometry to state
        state.geometries.push(newGeo);
        state.selectedGeometry.add(newGeo.id);
      });
    }
  });
}
