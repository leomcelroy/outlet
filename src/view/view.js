import { html, svg } from "lit-html";
import { drawSelectBox } from "./drawSelectBox.js";
import { drawTopBar } from "./drawTopBar.js";
import { drawToolbar } from "./drawToolbar.js";

export function view(state) {
  return html`
    <div class="h-screen w-screen flex flex-col">
      ${drawTopBar(state)}

      <div class="flex flex-1">
        <div
          class="w-64 border-r border-gray-400 p-4 bg-gray-300 shadow-[0.25rem_0_0.5rem_rgba(0,0,0,0.1)]"
        >
          Plug-Ins
        </div>

        <div class="relative flex-1">
          <svg sketch-board class="w-[100%] h-[100%]">
            <g transform-group>
              ${drawSelectBox(state)}
              <!-- -- -->
              ${drawLines(state)}
              <!-- -- -->
              ${drawTempLine(state)}
              <!-- -- -->
              ${drawPoints(state)}
              <!-- -- -->
            </g>
          </svg>
          ${drawToolbar(state)}
        </div>

        <div
          class="w-64 border-l border-gray-400 p-4 bg-gray-300 shadow-[-0.25rem_0_0.5rem_rgba(0,0,0,0.1)]"
        >
          Layer Panel
        </div>
      </div>
    </div>
  `;
}

const PT_SIZE = 5;

function drawPoints(state) {
  const points = state.geometries.filter((geo) => geo.type === "point");

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
      fill="black"
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
  `,
  );
}

function drawTempLine(state) {
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
      />
    `;
  }
  return "";
}

function drawLines(state) {
  const lines = state.geometries.filter((geo) => geo.type === "line");

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
      stroke="black"
      stroke-width=${PT_SIZE * 0.6}
      x1=${state.params[geoMap[line.p1].x]}
      y1=${state.params[geoMap[line.p1].y]}
      x2=${state.params[geoMap[line.p2].x]}
      y2=${state.params[geoMap[line.p2].y]}
    />
  `,
  );
}
