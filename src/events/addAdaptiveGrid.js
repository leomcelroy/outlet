export function addAdaptiveGrid(el, state) {
  el.addEventListener("wheel", () => {
    function getBaseLog(x, y) {
      return Math.log(y) / Math.log(x);
    }

    if (!state.panZoomMethods) return;

    const corners = state.panZoomMethods.corners();

    const xLimits = [corners.lt[0], corners.rt[0]];
    const xRange = Math.abs(xLimits[1] - xLimits[0]);
    const yLimits = [corners.lb[1], corners.lt[1]];
    const yRange = Math.abs(yLimits[1] - yLimits[0]);

    // Calculate a reasonable grid size based on the current zoom level
    const order = Math.round(getBaseLog(10, Math.max(xRange, yRange)));
    // Use powers of 10 for more intuitive scaling (1, 10, 100, etc.)
    // Divide by 10 to get more reasonable intermediate values
    const stepSize = state.adaptiveGrid
      ? Math.max(1, 10 ** order / 10)
      : state.gridSize;
    state.gridSize = stepSize;
  });
}
