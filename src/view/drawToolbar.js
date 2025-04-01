import { html } from "lit-html";
import { bounds } from "../utils/bounds.js";
import { convertPathToPolylines } from "../utils/convertPathToPolylines.js";

function drawEditingToolbar(state) {
  return html`
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
      ?data-active=${state.tool === "DRAW_PATH"}
      @click=${(e) => {
        state.tool = "DRAW_PATH";
      }}
      class="data-[active]:bg-indigo-500 data-[active]:text-white hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow-md text-sm"
    >
      Draw (d)
    </button>
    <button
      @click=${(e) => {
        state.editingPath = null;
        state.selectedGeometry = new Set();
      }}
      class="hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow-md text-sm"
    >
      Exit Path Edit (Esc)
    </button>
  `;
}

function drawNormalToolbar(state) {
  return html`
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
      ?data-active=${state.tool === "DRAW_PATH"}
      @click=${(e) => {
        state.tool = "DRAW_PATH";
      }}
      class="data-[active]:bg-indigo-500 data-[active]:text-white hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow-md text-sm"
    >
      Draw (d)
    </button>
  `;
}

export function drawToolbar(state) {
  return html`
    <div
      class="absolute bottom-4 left-[50%] flex flex-row space-x-2 justify-between -translate-x-[50%] bg-gray-200 rounded p-2 shadow-lg border border-gray-300"
    >
      <div class="flex space-x-2">
        ${state.editingPath
          ? drawEditingToolbar(state)
          : drawNormalToolbar(state)}
      </div>
    </div>
  `;
}
