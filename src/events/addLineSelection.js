import { createListener } from "../utils/createListener.js";
import { patchState } from "../index.js";

export function addLineSelection(el, state) {
  const listener = createListener(el);

  listener("mousedown", "[path]", (e) => {
    if (e.detail === 2) {
      // Double click
      const id = e.target.dataset.id;
      patchState((state) => {
        state.editingPath = id;
        state.selectedGeometry = new Set();
      });
    } else if (state.tool === "SELECT") {
      const id = e.target.dataset.id;
      state.selectedGeometry.add(id);
    }
  });

  // Keep existing line selection code
  listener("mousedown", "[line]", (e) => {
    const id = e.target.dataset.id;
    state.selectedGeometry.add(id);
  });
}
