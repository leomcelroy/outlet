import { html, svg } from "lit-html";
import { drawPoints } from "./drawPoints.js";
import { drawPolylines } from "./drawPolylines.js";
import { drawEdges } from "./drawEdges.js";

export function drawLayers(state) {
  const parentLayers = state.layers.filter((layer) => layer.parent === null);

  return html`${parentLayers.map((layer) => drawLayer(state, layer))}`;
}

function drawLayer(state, layer) {
  const relevantPoints = state.geometries.filter(
    (geo) => geo.type === "point" && geo.layer === state.activeLayer
  );

  const relevantEdges = state.geometries.filter(
    (geo) => geo.type === "edge" && geo.layer === state.activeLayer
  );

  return svg`
    <g layer data-layer-id=${layer.id}>
      ${layer.outputGeometry.map((pls) => drawPolylines(state, pls))}
      ${state.showBaseGeometry ? drawEdges(state, relevantEdges) : ""}
      ${state.showBaseGeometry ? drawPoints(state, relevantPoints) : ""}
    </g>
  `;
}
