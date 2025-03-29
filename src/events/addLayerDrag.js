import { createListener } from "../utils/createListener.js";
import { makePhantom } from "../utils/makePhantom.js";

export function addLayerDrag(state) {
  const el = document.body;
  const listener = createListener(el);

  let lastTarget = null;
  let lastPosition = "inside";
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

    const rect = candidate.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let pos = "inside";
    if (y < rect.height * 0.25) pos = "before";
    else if (y > rect.height * 0.75) pos = "after";

    if (candidate !== lastTarget || pos !== lastPosition) {
      unhighlight();
      candidate.classList.add(
        pos === "before"
          ? "border-t-2"
          : pos === "after"
          ? "border-b-2"
          : "bg-blue-50"
      );
      lastTarget = candidate;
      lastPosition = pos;
    }
  }

  function unhighlight() {
    if (!lastTarget) return;
    lastTarget.classList.remove("bg-blue-50", "border-t-2", "border-b-2");
    lastTarget = null;
  }

  listener("mousedown", "[draggable-layer-trigger] *", (e) => {
    const layer = e.target.closest("[draggable-layer]");

    if (!layer?.dataset?.nodeId) return;

    sourceId = layer.dataset.nodeId;

    makePhantom(e, layer, () => {
      if (lastTarget && lastTarget.dataset.nodeId !== sourceId) {
        state.dispatch({
          type: "MOVE_LAYER",
          sourceId,
          targetId: lastTarget.dataset.nodeId,
          position: lastPosition,
        });
      }
      unhighlight();
      sourceId = null;
      document.removeEventListener("mousemove", highlightTarget);
    });

    document.addEventListener("mousemove", highlightTarget);
  });
}
