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
      cx=${state.params[point.x]}
      cy=${state.params[point.y]}
      r=${PT_SIZE}
      fill=${layer.attributes.fill || "black"}
      stroke=${layer.attributes.stroke || "none"}
      stroke-width=${layer.attributes.strokeWidth || 0}
      class="hover:fill-orange-500 data-[selected]:fill-red-500"
    />
    ${
      currentPoint && currentPoint.overlap === point.id
        ? svg`
      <rect
        x=${state.params[point.x] - boxSize / 2}
        y=${state.params[point.y] - boxSize / 2}
        width=${boxSize}
        height=${boxSize}
        fill="none"
        stroke="black"
        stroke-width=${PT_SIZE * 0.5}
      />
    `
        : ""
    }
  `);
}

function drawLines(state, lines, layer) {
  // layerGeometry is already flattened in drawLayer
  const geoMap = {};
  state.geometries.forEach((geo) => {
    geoMap[geo.id] = geo;
  });

  return lines.map(
    (line) => svg`
    <line
      line
      data-id=${line.id}
      ?data-selected=${state.selectedGeometry.has(line.id)}
      class="hover:stroke-orange-500 data-[selected]:stroke-red-500"
      stroke=${layer.attributes.stroke || "black"}
      stroke-width=${layer.attributes.strokeWidth || PT_SIZE * 0.6}
      x1=${state.params[geoMap[line.p1].x]}
      y1=${state.params[geoMap[line.p1].y]}
      x2=${state.params[geoMap[line.p2].x]}
      y2=${state.params[geoMap[line.p2].y]}
    />
  `);
}

function drawLayer(state, layer) {
  const flatGeometry = layer.outputGeometry;  
  return svg`
    <g layer data-layer-id=${layer.id}>
      ${drawLines(state, flatGeometry.filter(x => x.type === "line"), layer)}
      ${drawPoints(state, flatGeometry.filter(x => x.type === "point"), layer)}
    </g>
  `;
}

export function drawLayers(state) {
  // Draw parent layers
  const parentLayers = state.layers.filter(layer => layer.parent === null);
  
  return html`
    ${parentLayers.map(layer => drawLayer(state, layer))}
  `;
}