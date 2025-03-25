import { createListener } from "../utils/createListener.js";

export function addLineSelection(el, state) {
  const listener = createListener(el);

  listener("mousedown", "[line]", (e) => {
    const id = e.target.dataset.id;
    state.selectedGeometry.add(id);
  });
}
