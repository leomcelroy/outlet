import { html } from "lit-html";
import { download } from "../utils/download.js";
import { patchState } from "../index.js";

export function drawTopBar(state) {
  return html`
    <div
      class="bg-gray-100 border-b border-gray-400 shadow-md flex items-center"
    >
      <div
        @click=${(e) => {
          const name = prompt("Please provide a filename.");
          if (!name) return;
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

      <div class="relative ml-4 group">
        <div class="flex items-center hover:bg-gray-200 p-2 rounded">
          Grid Options
        </div>
        <div class="absolute z-50 hidden group-hover:block bg-gray-200 w-max">
          <div class="flex items-center p-2">
            <input
              type="checkbox"
              ?checked=${state.grid}
              class="mr-2 cursor-pointer"
              @click=${() => {
                patchState((state) => {
                  state.grid = !state.grid;
                });
              }}
            />
            <span>Show Grid</span>
          </div>
          <div class="flex items-center p-2">
            <input
              type="checkbox"
              class="mr-2 cursor-pointer"
              ?checked=${state.adaptiveGrid}
              @click=${() => {
                patchState((state) => {
                  state.adaptiveGrid = !state.adaptiveGrid;
                });
              }}
              class="mr-2"
            />
            <span>Adaptive Grid</span>
          </div>
          <div class="flex items-center p-2">
            <label class="mr-2">Grid Size:</label>
            <input
              class="bg-white pl-1 rounded"
              type="number"
              min="1"
              max="100"
              .value=${state.gridSize}
              @change=${(e) => {
                const value = parseInt(e.target.value, 10);
                if (value > 0) {
                  patchState((state) => {
                    state.gridSize = value;
                  });
                }
              }}
              class="border border-gray-300 p-1 w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  `;
}
