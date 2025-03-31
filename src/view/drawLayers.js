import { html, svg } from "lit-html";

const PT_SIZE = 5;

function drawPoints(state, points, layer) {
  const currentPoint = state.currentPoint;
  const boxSize = 2.75 * PT_SIZE;

  return points.map(
    (point) => svg`
    <circle
      point
      data-id=${point.id}
      ?data-selected=${state.selectedGeometry.has(point.id)}
      cx=${point.x}
      cy=${point.y}
      r=${PT_SIZE}
      fill=${layer.attributes.fill || "black"}
      stroke=${layer.attributes.stroke || "none"}
      stroke-width=${layer.attributes.strokeWidth || 0}
      class="hover:fill-orange-500 data-[selected]:fill-red-500"
      vector-effect="non-scaling-stroke"
    />
    ${
      currentPoint && currentPoint.overlap === point.id
        ? svg`
      <rect
        x=${point.x - boxSize / 2}
        y=${point.y - boxSize / 2}
        width=${boxSize}
        height=${boxSize}
        fill="none"
        stroke="black"
        stroke-width=${PT_SIZE * 0.5}
        vector-effect="non-scaling-stroke"
      />
    `
        : ""
    }
  `
  );
}

function drawLines(state, lines, layer) {
  return lines.map(
    (line) => svg`
    <line
      line
      data-id=${line.id}
      ?data-selected=${state.selectedGeometry.has(line.id)}
      class="hover:stroke-orange-500 data-[selected]:stroke-red-500"
      stroke=${layer.attributes.stroke || "black"}
      stroke-width=${layer.attributes.strokeWidth || PT_SIZE * 0.6}
      vector-effect="non-scaling-stroke"
      x1=${line.x1}
      y1=${line.y1}
      x2=${line.x2}
      y2=${line.y2}
    />
  `
  );
}

function drawLayer(state, layer) {
  const flatGeometry = layer.outputGeometry;
  return svg`
    <g layer data-layer-id=${layer.id}>
      ${drawLines(
        state,
        flatGeometry.filter((x) => x.type === "line"),
        layer
      )}
      ${drawPoints(
        state,
        flatGeometry.filter((x) => x.type === "point"),
        layer
      )}
    </g>
  `;
}

export function drawLayers(state) {
  // Draw parent layers
  const parentLayers = state.layers.filter((layer) => layer.parent === null);

  return html` ${parentLayers.map((layer) => drawLayer(state, layer))} `;
}
