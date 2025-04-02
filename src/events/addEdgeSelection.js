import { createListener } from "../utils/createListener.js";

export function addEdgeSelection(el, state) {
  const listener = createListener(el);

  listener("mousedown", "[edge]", (e) => {
    const id = e.target.dataset.id;
    state.selectedGeometry.add(id);
  });
}
