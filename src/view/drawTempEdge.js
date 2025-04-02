import { svg } from "lit-html";

const PT_SIZE = 5;

export function drawTempEdge(state) {
  const { currentPoint, edgeStart } = state;

  if (edgeStart && currentPoint) {
    const edgeStartPt = state.geometries.find((geo) => geo.id === edgeStart);
    return svg`
        <line
          x1=${state.params[edgeStartPt.x]}
          y1=${state.params[edgeStartPt.y]}
          x2=${currentPoint.x}
          y2=${currentPoint.y}
          stroke="blue"
          stroke-width=${PT_SIZE * 0.6}
          vector-effect="non-scaling-stroke"
        />
      `;
  }
  return "";
}
