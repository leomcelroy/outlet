import { createListener } from "../utils/createListener.js";
import { makePhantom } from "../utils/makePhantom.js";

export function addPluginDrag(state) {
  const el = document.body;
  const listener = createListener(el);

  let lastTarget = null;
  let lastPosition = "after";
  let sourceId = null;

  function highlightTarget(e) {
    if (!sourceId) return;

    const candidate = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[draggable-plugin]");

    if (!candidate || candidate.dataset.pluginId === sourceId) {
      unhighlight();
      return;
    }

    const rect = candidate.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const pos = y < rect.height / 2 ? "before" : "after";

    if (candidate !== lastTarget || pos !== lastPosition) {
      unhighlight();
      candidate.classList.add(pos === "before" ? "border-t-2" : "border-b-2");
      lastTarget = candidate;
      lastPosition = pos;
    }
  }

  function unhighlight() {
    if (!lastTarget) return;
    lastTarget.classList.remove("border-t-2", "border-b-2");
    lastTarget = null;
  }

  listener("mousedown", "[draggable-plugin-trigger] *", (e) => {
    const plugin = e.target.closest("[draggable-plugin]");

    if (!plugin?.dataset?.pluginId) return;

    sourceId = plugin.dataset.pluginId;

    makePhantom(e, plugin, () => {
      if (lastTarget && lastTarget.dataset.pluginId !== sourceId) {
        state.dispatch({
          type: "MOVE_PLUGIN",
          sourceId,
          targetId: lastTarget.dataset.pluginId,
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
