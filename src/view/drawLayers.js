import { html, svg } from "lit-html";

const PT_SIZE = 5;

function drawPoints(state, points) {
  return points.map(
    (point) => svg`
    <circle
      point
      data-id=${point.id}
      ?data-selected=${state.selectedGeometry.has(point.id)}
      cx=${state.params[point.x]}
      cy=${state.params[point.y]}
      r=${PT_SIZE}
      fill="black"
      class="hover:fill-orange-500 data-[selected]:fill-red-500"
      vector-effect="non-scaling-stroke"
    />
    ${
      state.currentPoint && state.currentPoint.overlap === point.id
        ? svg`
      <rect
        x=${state.params[point.x] - (2.75 * PT_SIZE) / 2}
        y=${state.params[point.y] - (2.75 * PT_SIZE) / 2}
        width=${2.75 * PT_SIZE}
        height=${2.75 * PT_SIZE}
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

function drawPaths(state, paths, layer) {
  return paths.map((path) => {
    let pathData = "";
    path.data.forEach((cmd, i) => {
      if (cmd.cmd === "start") {
        pathData += `M ${cmd.x} ${cmd.y} `;
      } else if (cmd.cmd === "line") {
        pathData += `L ${cmd.x} ${cmd.y} `;
      } else if (cmd.cmd === "curve") {
        pathData += `C ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y} `;
      } else if (cmd.cmd === "close") {
        pathData += "Z ";
      }
    });

    return svg`
      <path
        path
        data-id=${path.id}
        ?data-selected=${state.selectedGeometry.has(path.id)}
        class="hover:stroke-orange-500 data-[selected]:stroke-red-500"
        d=${pathData}
        fill=${path.attributes?.fill || layer.attributes.fill || "none"}
        stroke=${path.attributes?.stroke || layer.attributes.stroke || "black"}
        stroke-width=${
          path.attributes?.strokeWidth ||
          layer.attributes.strokeWidth ||
          PT_SIZE * 0.6
        }
        vector-effect="non-scaling-stroke"
      />
    `;
  });
}

function drawLayer(state, layer) {
  const flatGeometry = layer.outputGeometry;

  const editingPath = state.geometries.find((g) => g.id === state.editingPath);
  const editingPathPoints = new Set();
  editingPath?.data.forEach((cmd) => {
    if (cmd.point) {
      editingPathPoints.add(cmd.point);
    }
    if (cmd.control1) {
      editingPathPoints.add(cmd.control1);
    }
    if (cmd.control2) {
      editingPathPoints.add(cmd.control2);
    }
  });

  const allPoints = state.geometries.filter((x) => x.type === "point");

  // Get ALL points from state.geometries that are used in the editing path
  const relevantPoints = editingPath
    ? allPoints.filter((point) => editingPathPoints.has(point.id))
    : [];

  return svg`
    <g layer data-layer-id=${layer.id}>
      ${drawLines(
        state,
        flatGeometry.filter((x) => x.type === "line"),
        layer
      )}
      ${drawPaths(
        state,
        flatGeometry.filter((x) => x.type === "path"),
        layer
      )}
      ${drawPoints(state, relevantPoints, layer)}
    </g>
  `;
}

export function drawLayers(state) {
  // Draw parent layers
  const parentLayers = state.layers.filter((layer) => layer.parent === null);

  return html` ${parentLayers.map((layer) => drawLayer(state, layer))} `;
}
