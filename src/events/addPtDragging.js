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

    // Calculate raw delta
    let dx = currentPoint[0] - mousedownPoint[0];
    let dy = currentPoint[1] - mousedownPoint[1];

    // Get the clicked point
    const clickedPt = state.geometries.find(
      (g) => g.id === clickedPtId && g.type === "point"
    );

    if (clickedPt) {
      const clickedXId = clickedPt.x;
      const clickedYId = clickedPt.y;

      // Calculate new position for clicked point
      let newClickedX = ogParams[clickedXId] + dx;
      let newClickedY = ogParams[clickedYId] + dy;

      // Only snap the clicked point if grid is enabled
      if (state.grid) {
        const stepSize = state.gridSize;
        const snappedX = Math.round(newClickedX / stepSize) * stepSize;
        const snappedY = Math.round(newClickedY / stepSize) * stepSize;

        // Recalculate dx and dy based on the snapped position
        dx = snappedX - ogParams[clickedXId];
        dy = snappedY - ogParams[clickedYId];
      }
    }

    // Apply the (potentially adjusted) dx and dy to all selected points
    state.selectedGeometry.forEach((id) => {
      const pt = state.geometries.find(
        (g) => g.id === id && g.type === "point"
      );
      if (pt === undefined) return;

      const xId = pt.x;
      const yId = pt.y;

      // Apply the same delta to all points
      state.params[xId] = ogParams[xId] + dx;
      state.params[yId] = ogParams[yId] + dy;
    });

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
