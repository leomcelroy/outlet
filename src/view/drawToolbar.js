import { html } from "lit-html";

export function drawToolbar(state) {
  return html`
    <div
      class="absolute bottom-4 left-[50%] flex flex-row space-x-2 justify-between -translate-x-[50%] bg-gray-200 rounded p-2 shadow-lg border border-gray-300"
    >
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
          state.dispatch({ type: "SET_TOOL", tool: "DRAW" });
        }}
        class="data-[active]:bg-indigo-500 data-[active]:text-white hover:bg-indigo-400 bg-gray-400 text-black py-1 px-2 rounded shadow-md text-sm"
      >
        Draw (d)
      </button>
    </div>
  `;
}
