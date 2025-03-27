import { html, svg } from "lit-html";
import { drawSelectBox } from "./drawSelectBox.js";
import { drawTopBar } from "./drawTopBar.js";
import { drawToolbar } from "./drawToolbar.js";
import { drawLayers } from "./drawLayers.js";
import { drawTempLine } from "./drawTempLine.js";
import { drawLayerTree } from "./drawLayerTree.js";
import { drawPlugins } from "./drawPlugins.js";

export function view(state) {
  return html`
    <div class="h-screen w-screen flex flex-col">
      ${drawTopBar(state)}

      <div class="flex flex-1">
        <div
          class="w-64 border-r border-gray-400 p-4 bg-gray-300 shadow-[0.25rem_0_0.5rem_rgba(0,0,0,0.1)]"
        >
          Plugins
        </div>

        <div class="relative flex-1">
          <svg sketch-board class="w-[100%] h-[100%]">
            <g transform-group>
              ${drawSelectBox(state)}
              <!-- -- -->
              ${drawLayers(state)}
              <!-- -- -->
              ${drawTempLine(state)}
              <!-- -- -->
            </g>
          </svg>
          ${drawToolbar(state)}
        </div>
        <div class="max-h-full h-full overflow-hidden w-64 border-l border-gray-400 p-4 bg-gray-300 shadow-[-0.25rem_0_0.5rem_rgba(0,0,0,0.1)]">
          ${drawLayerTree(state)}
          ${drawPlugins(state)}
        </div>
      </div>
    </div>
  `;
}

