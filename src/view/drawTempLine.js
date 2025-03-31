import { svg } from "lit-html";

const PT_SIZE = 5;

export function drawTempLine(state) {
  const { currentPoint, lineStart } = state;

  if (lineStart && currentPoint) {
    const lineStartPt = state.geometries.find((geo) => geo.id === lineStart);
    return svg`
        <line
          x1=${state.params[lineStartPt.x]}
          y1=${state.params[lineStartPt.y]}
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
