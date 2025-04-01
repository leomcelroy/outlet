import { deleteGeometry } from "../utils/deleteGeometry.js";
import { evaluateAllLayers } from "../evaluateAllLayers.js";
import { filterSingleCommandPaths } from "../utils/filterSingleCommandPaths.js";

// import { hitEsc } from "../utils/hitEsc.js";

export function addHotKeys(state) {
  window.addEventListener("keydown", (e) => {
    if (e.key === "d") {
      state.currentPath = null;
      state.selectedGeometry = new Set();
      state.dispatch({ type: "SET_TOOL", tool: "DRAW_PATH" });
    }

    if (e.key === "s") {
      state.dispatch({ type: "SET_TOOL", tool: "SELECT" });
    }

    if (e.key === "Escape") {
      state.editingPath = null;
      state.currentPath = null;
      state.selectedGeometry = new Set();
      state.currentPoint = null;
      // Filter out paths with only one command
      filterSingleCommandPaths(state);
    }

    if (e.key === "Enter") {
      state.currentPath = null;
      state.currentPoint = null;
      // currentMoveCmd = null;
    }

    if (e.key === "Backspace") {
      deleteGeometry(state);
      evaluateAllLayers();
    }
  });
}
