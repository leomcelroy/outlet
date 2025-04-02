import { svg } from "lit-html";

const PT_SIZE = 5;

export function drawEdges(state, edges) {
  return edges.map((edge) => {
    const p1 = state.geometries.find((geo) => geo.id === edge.p1);
    const p2 = state.geometries.find((geo) => geo.id === edge.p2);

    if (!p1 || !p2) return "";

    return svg`
        <line
          edge
          data-id=${edge.id}
          ?data-selected=${state.selectedGeometry.has(edge.id)}
          x1=${state.params[p1.x]}
          y1=${state.params[p1.y]}
          x2=${state.params[p2.x]}
          y2=${state.params[p2.y]}
          stroke="#15b9dd3b"
          stroke-width=${PT_SIZE * 0.6}
          class=${
            state.isDragging
              ? "data-[selected]:stroke-red-500"
              : "hover:stroke-orange-500 data-[selected]:stroke-red-500"
          }
          vector-effect="non-scaling-stroke"
        />
      `;
  });
}
