import { html, svg } from "lit-html";
import { drawSelectBox } from "./drawSelectBox.js";
import { download } from "../utils/download.js";

export function view(state) {
  return html`
    <div class="h-screen w-screen flex flex-col">
      <!-- Top bar -->
      <div class="bg-gray-100 border-b">
        <div
          @click=${(e) => {
            const name = prompt("Please provide a filename.");
            if (name === "" || !name) return;

            const file = JSON.stringify({
              geometries: state.geometries,
              params: state.params,
            });

            download(`${name}.sketch.json`, file);
          }}
          class="hover:bg-gray-200 w-fit p-2 cursor-pointer"
        >
          Download
        </div>
      </div>

      <div class="w-1/2 p-2 mx-auto">
        <svg
          sketch-board
          class="w-full aspect-square bg-gray-100 border border-gray-400 rounded"
        >
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
        <div class="flex flex-row mt-4 space-x-2 justify-between">
          <div class="flex space-x-2">
            <button
              ?data-active=${state.tool === "SELECT"}
              @click=${(e) => {
                state.tool = "SELECT";
              }}
              class="data-[active]:bg-indigo-500 data-[active]:text-white hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow text-sm"
            >
              Select (s)
            </button>
            <button
              ?data-active=${state.tool === "DRAW"}
              @click=${(e) => {
                state.tool = "DRAW";
              }}
              class="data-[active]:bg-indigo-500 data-[active]:text-white hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow text-sm"
            >
              Draw (d)
            </button>
            <button
              @click=${(e) => {
                state.geometries = [];
                state.params = {};
              }}
              class="hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow text-sm"
            >
              Clear
            </button>
          </div>
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
