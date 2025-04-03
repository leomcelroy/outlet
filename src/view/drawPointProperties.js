import { html } from "lit-html";

export function drawPointProperties(state) {
  // Get selected points
  const selectedPoints = state.geometries.filter(
    (geo) => geo.type === "point" && state.selectedGeometry.has(geo.id)
  );

  // Count selected points
  const selectedCount = selectedPoints.length;

  // Check if all selected points are curvy
  const allCurvy = selectedPoints.every(
    (point) => point.cornerType === "curvy"
  );
  const allStraight = selectedPoints.every(
    (point) => point.cornerType === "straight"
  );

  // Get average curve value
  const avgCurveValue =
    selectedPoints.length > 0
      ? selectedPoints.reduce(
          (sum, point) => sum + (point.cornerValue || 0),
          0
        ) / selectedCount
      : 0;

  return html`
    <div
      class="hidden absolute top-0 right-0 z-10 bg-white p-4 rounded-lg shadow-lg m-4"
    >
      <h2 class="text-lg font-semibold mb-2">Point Properties</h2>

      <div class="mb-2">
        <span class="text-sm text-gray-600"
          >${selectedCount} point${selectedCount !== 1 ? "s" : ""}
          selected</span
        >
      </div>

      ${selectedCount > 0
        ? html`
            <div class="space-y-2">
              <div class="flex gap-2">
                <button
                  class="px-3 py-1 text-sm rounded ${allStraight
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"}"
                  @click=${() => {
                    selectedPoints.forEach((point) => {
                      point.cornerType = "straight";
                      point.cornerValue = 0.5;
                    });
                    state.dispatch({ type: "EVALUATE_LAYERS" });
                  }}
                >
                  Straight
                </button>
                <button
                  class="px-3 py-1 text-sm rounded ${allCurvy
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"}"
                  @click=${() => {
                    selectedPoints.forEach((point) => {
                      point.cornerType = "curvy";
                      if (point.cornerValue === undefined)
                        point.cornerValue = 0.5;
                    });
                    state.dispatch({ type: "EVALUATE_LAYERS" });
                  }}
                >
                  Curvy
                </button>
              </div>

              <div
                class="flex items-center gap-2 ${!allCurvy ? "opacity-50" : ""}"
              >
                <label class="text-sm">Curve Strength:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value=${avgCurveValue}
                  class="w-32"
                  ?disabled=${!allCurvy}
                  @input=${(e) => {
                    // const value = parseFloat(e.target.value);
                    // selectedPoints.forEach((point) => {
                    //   point.cornerValue = value;
                    // });
                    // state.dispatch({ type: "EVALUATE_LAYERS" });
                  }}
                />
                <span class="text-sm">${avgCurveValue.toFixed(1)}</span>
              </div>
            </div>
          `
        : html`
            <div class="text-sm text-gray-500">
              Select points to edit properties
            </div>
          `}
    </div>
  `;
}
