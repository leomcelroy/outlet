import { createListener } from "../utils/createListener.js";
import { makePhantom } from "../utils/makePhantom.js";

export function addPathDrag(state) {
  const el = document.body;
  const listener = createListener(el);

  let lastTarget = null;
  let sourceId = null;

  function highlightTarget(e) {
    if (!sourceId) return;

    const candidate = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[draggable-layer]");

    if (!candidate || candidate.dataset.nodeId === sourceId) {
      unhighlight();
      return;
    }

    if (candidate !== lastTarget) {
      unhighlight();
      candidate.classList.add("bg-blue-50");
      lastTarget = candidate;
    }
  }

  function unhighlight() {
    if (!lastTarget) return;
    lastTarget.classList.remove("bg-blue-50");
    lastTarget = null;
  }

  listener("mousedown", "[draggable-path-trigger] *", (e) => {
    const path = e.target.closest("[draggable-path]");

    if (!path?.dataset?.pathId) return;

    sourceId = path.dataset.pathId;

    makePhantom(e, path, () => {
      if (lastTarget && lastTarget.dataset.nodeId !== sourceId) {
        state.dispatch({
          type: "MOVE_PATH_TO_LAYER",
          pathId: sourceId,
          targetLayerId: lastTarget.dataset.nodeId,
        });
      }
      unhighlight();
      sourceId = null;
      document.removeEventListener("mousemove", highlightTarget);
    });

    document.addEventListener("mousemove", highlightTarget);
  });
}
