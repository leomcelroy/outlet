import { deleteGeometry } from "../utils/deleteGeometry.js";
import { clearEdgeStartIfNoConnections } from "../utils/clearEdgeStartIfNoConnections.js";

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
  });
}
