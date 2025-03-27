import { patchState } from "../index.js";
import { createListener } from "../utils/createListener.js";
import { evaluateAllLayers } from "../evaluateAllLayers.js";

export function addPtDragging(el, state) {
  function getPoint(e) {
    let rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    return el.transformPoint ? el.transformPoint([x, y]) : [x, y];
  }

  const listener = createListener(el);

  let dragging = false;
  let mousedownPoint = [0, 0];
  let ogParams = {};
  let clickedPtId = null;

  listener("mousedown", "[point]", (e) => {
    if (state.tool !== "SELECT") return;

    // el.panZoomMethods.cancelPanZoom(false);

    const id = e.target.dataset.id;
    clickedPtId = id;

    const ptSelected = state.selectedGeometry.has(id);

    if (!e.shiftKey && !ptSelected) {
      state.selectedGeometry = new Set([id]);
    }

    if (e.shiftKey) {
      if (ptSelected) {
        state.selectedGeometry.delete(id);
      } else {
        state.selectedGeometry.add(id);
      }
    }

    dragging = e.detail === 1;
    if (dragging) {
      el.panZoomMethods.cancelPanZoom(true);
    }
    mousedownPoint = getPoint(e);
    ogParams = JSON.parse(JSON.stringify(state.params));
  });

  listener("mousedown", "", (e) => {
    if (state.tool !== "SELECT") return;

    if (e.target.matches("[point]")) return;

    if (e.detail === 2) {
      patchState((state) => {
        state.selectedGeometry = new Set();
      });
    }
  });

  listener("mousemove", "", (e) => {
    if (dragging === false) return;

    const currentPoint = getPoint(e);

    const dx = currentPoint[0] - mousedownPoint[0];
    const dy = currentPoint[1] - mousedownPoint[1];

    state.selectedGeometry.forEach((id) => {
      const pt = state.geometries.find(
        (g) => g.id === id && g.type === "point",
      );
      if (pt === undefined) return;

      const xId = pt.x;
      const yId = pt.y;
      state.params[xId] = ogParams[xId] + dx;
      state.params[yId] = ogParams[yId] + dy;
    });

    // const pt = state.geometries.find((g) => g.id === clickedPtId);
    // const getIndex = (id) => Object.keys(state.params).indexOf(id);

    patchState();
    evaluateAllLayers();
  });

  listener("mouseup", "", (e) => {
    if (dragging === false) return;

    if (!e.shiftKey && state.selectedGeometry.size === 1) {
      state.selectedGeometry = new Set();
    }

    dragging = false;
    el.panZoomMethods.cancelPanZoom(false);
  });
}
