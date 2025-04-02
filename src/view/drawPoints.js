import { svg } from "lit-html";

const PT_SIZE = 5;
const PT_SELECTION_SIZE = 2.75 * PT_SIZE;
const PT_SELECTION_OFFSET = PT_SELECTION_SIZE / 2;

export function drawPoints(state, points) {
  const scale = state.panZoomMethods ? state.panZoomMethods.scale() : 1;

  return points.map((point) => {
    return svg`
    <circle
      point
      data-id=${point.id}
      ?data-selected=${state.selectedGeometry.has(point.id)}
      cx=${state.params[point.x]}
      cy=${state.params[point.y]}
      r=${PT_SIZE / scale}
      fill="black"
      class="hover:fill-orange-500 data-[selected]:fill-red-500"
      vector-effect="non-scaling-stroke"
    />
    ${
      state.currentPoint && state.currentPoint.overlap === point.id
        ? svg`
      <rect
        x=${state.params[point.x] - PT_SELECTION_OFFSET / scale}
        y=${state.params[point.y] - PT_SELECTION_OFFSET / scale}
        width=${PT_SELECTION_SIZE / scale}
        height=${PT_SELECTION_SIZE / scale}
        fill="none"
        stroke="black"
        stroke-width=${PT_SIZE * 0.5}
        vector-effect="non-scaling-stroke"
      />
    `
        : ""
    }
  `;
  });
}
