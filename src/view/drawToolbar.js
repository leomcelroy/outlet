import { html } from "lit-html";
import { stroke } from "../plugins/stroke.js";

export function drawToolbar(state) {
  return html`
    <div
      class="absolute bottom-4 left-[50%] flex flex-row space-x-2 justify-between -translate-x-[50%] bg-gray-200 rounded p-2 shadow-lg border border-gray-300"
    >
      <div class="flex space-x-2">
        ${state.editingPath
          ? html`
              <button
                @click=${(e) => {
                  state.editingPath = null;
                  state.selectedGeometry = new Set();
                }}
                class="hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow-md text-sm"
              >
                Exit Path Edit (Esc)
              </button>
            `
          : html`
              <button
                ?data-active=${state.tool === "SELECT"}
                @click=${(e) => {
                  state.dispatch({ type: "SET_TOOL", tool: "SELECT" });
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
                ?data-active=${state.tool === "DRAW_PATH"}
                @click=${(e) => {
                  state.tool = "DRAW_PATH";
                }}
                class="data-[active]:bg-indigo-500 data-[active]:text-white hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow-md text-sm"
              >
                Draw Path (p)
              </button>
              <button
                @click=${(e) => {
                  state.dispatch({ type: "CLEAR" });
                }}
                class="hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow-md text-sm"
              >
                Clear
              </button>
            `}
      </div>
    </div>
  `;
}
