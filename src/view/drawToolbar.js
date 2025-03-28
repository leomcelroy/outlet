import { html } from "lit-html";
import { stroke } from "../plugins/stroke.js";

export function drawToolbar(state) {
  return html`
    <div
      class="absolute bottom-4 left-[50%] flex flex-row space-x-2 justify-between -translate-x-[50%] bg-gray-200 rounded p-2 shadow-lg border border-gray-300"
    >
      <div class="flex space-x-2">
        <button
          ?data-active=${state.tool === "SELECT"}
          @click=${(e) => {
            state.tool = "SELECT";
          }}
          class="data-[active]:bg-indigo-500 data-[active]:text-white hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow-md text-sm"
        >
          Select (s)
        </button>
        <button
          ?data-active=${state.tool === "DRAW"}
          @click=${(e) => {
            state.tool = "DRAW";
          }}
          class="data-[active]:bg-indigo-500 data-[active]:text-white hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow-md text-sm"
        >
          Draw (d)
        </button>
        <button
          @click=${(e) => {
            state.geometries = [];
            state.params = {};
            state.layers = [
              {
                id: "DEFAULT_LAYER",
                name: "Default Layer",
                parent: null,
                children: ["LAYER_1"],
                plugins: [stroke.init()],
                attributes: {},
                outputGeometry: [],
                inputGeometry: [],
              },
            ];
            state.activeLayer = "DEFAULT_LAYER";

            const file = JSON.stringify({
              geometries: state.geometries,
              params: state.params,
              layers: state.layers,
            });
            sessionStorage.setItem("sketchState", file);
          }}
          class="hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow text-sm"
        >
          Clear
        </button>
      </div>
    </div>
  `;
}
