import { html, svg } from "lit-html";
import { drawSelectBox } from "./drawSelectBox.js";
import { drawTopBar } from "./drawTopBar.js";
import { drawToolbar } from "./drawToolbar.js";
import { drawLayers } from "./drawLayers.js";
import { drawTempLine } from "./drawTempLine.js";
import { drawTempPath } from "./drawTempPath.js";
import { drawLayerTree } from "./drawLayerTree.js";
import { drawPlugins } from "./drawPlugins.js";
import { drawGrid } from "./drawGrid.js";

export function view(state) {
  return html`
    <div class="h-screen w-screen flex flex-col">
      ${drawTopBar(state)}

      <div class="flex flex-1 overflow-hidden">
        <div class="relative flex-1">
          <svg sketch-board class="w-[100%] h-[100%]">
            ${state.panZoomMethods && state.gridSize > 0 && state.grid
              ? drawGrid(
                  state.panZoomMethods.x(),
                  state.panZoomMethods.y(),
                  state.panZoomMethods.scale(),
                  state.panZoomMethods.corners(),
                  state.gridSize
                )
              : ""}
            <g transform-group>
              ${drawSelectBox(state)}
              <!-- -- -->
              ${drawLayers(state)}
              <!-- -- -->
              ${state.tool === "DRAW" ? drawTempLine(state) : ""}
              ${state.tool === "DRAW_PATH" ? drawTempPath(state) : ""}
              <!-- -- -->
            </g>
          </svg>
          <div
            class="absolute bottom-4 left-4 font-mono bg-gray-200 rounded px-2 py-1 text-sm shadow-lg border border-gray-300"
          >
            x: ${state.canvasX?.toFixed(1).padStart(7, " ") ?? "  -----"}, y:
            ${state.canvasY?.toFixed(1).padStart(7, " ") ?? "  -----"}
          </div>
          ${drawToolbar(state)}
          <div
            modal-controls-container
            class="absolute bottom-0 right-0 z-10"
          ></div>
        </div>
        <div
          class="flex flex-col max-h-full h-full overflow-hidden w-80 border-l border-gray-400 p-2 bg-gray-300 shadow-[-0.25rem_0_0.5rem_rgba(0,0,0,0.1)]"
        >
          ${drawLayerTree(state)} ${drawPlugins(state)}
        </div>
      </div>
    </div>
  `;
}
