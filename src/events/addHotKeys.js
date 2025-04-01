import { deleteGeometry } from "../utils/deleteGeometry.js";
import { evaluateAllLayers } from "../evaluateAllLayers.js";

// import { hitEsc } from "../utils/hitEsc.js";

export function addHotKeys(state) {
  window.addEventListener("keydown", (e) => {
    if (e.key === "d") {
      state.currentPath = null;
      state.selectedGeometry = new Set();
      state.tool = "DRAW_PATH";
    }

    if (e.key === "s") {
      state.tool = "SELECT";
    }

    if (e.key === "Escape") {
      state.editingPath = null;
      state.currentPath = null;
      state.selectedGeometry = new Set();
      state.currentPoint = null;
      // currentMoveCmd = null;
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
