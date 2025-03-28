import { html, svg } from "lit-html";
import { getLayerTree } from "../getLayerTree.js";

export function drawLayerTree(state) {
  return html`
    <div class="h-1/2 overflow-hidden flex flex-col">
      <div class="flex justify-between items-center mb-2">
        <div class="text-lg font-bold">Layers</div>
        <button
          @click=${() => state.dispatch({ type: "ADD_LAYER" })}
          class="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + New Layer
        </button>
      </div>
      <div class="flex-1 overflow-auto bg-gray-200 rounded pb-10">
        ${renderLayerTree(getLayerTree(), state)}
      </div>
    </div>
  `;
}

function renderLayerTree(tree, state) {
  return tree.map((node) => {
    const isExpanded = state.expandedLayers?.includes(node.id) ?? false;
    const isActive = state.activeLayer === node.id;

    return html`
      <div class="pl-${node.depth * 4} border-l-2 border-gray-400 mx-2 my-2">
        <div class="flex items-center">
          <button
            @click=${() =>
              state.dispatch({
                type: "TOGGLE_LAYER",
                layerId: node.id,
              })}
            class="mx-1 w-3 h-3 text-xs rounded-xs hover:bg-gray-200 cursor-pointer"
          >
            ${isExpanded
              ? svg`<svg width="10" height="10" viewBox="0 0 10 10"><path d="M1,3 L9,3 L5,8 Z" fill="currentColor"/></svg>`
              : svg`<svg width="10" height="10" viewBox="0 0 10 10"><path d="M3,1 L8,5 L3,9 Z" fill="currentColor"/></svg>`}
          </button>

          <span
            class="font-medium hover:bg-blue-100 px-2 ${isActive
              ? "bg-blue-200"
              : ""} w-full block cursor-pointer"
            @click=${() =>
              state.dispatch({ type: "SET_ACTIVE_LAYER", layerId: node.id })}
            @dblclick=${(e) => {
              const input = document.createElement("input");
              input.value = node.name;
              input.className = "w-full px-2 py-0 border rounded";

              const span = e.target;
              span.replaceWith(input);
              input.focus();

              input.addEventListener("blur", () => {
                state.dispatch({
                  type: "SET_LAYER_NAME",
                  layerId: node.id,
                  name: input.value,
                });
                input.replaceWith(span);
              });

              input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  input.blur();
                }
                if (e.key === "Escape") {
                  input.replaceWith(span);
                }
              });
            }}
          >
            ${node.name}</span
          >
        </div>

        ${isExpanded
          ? html`
              ${node.geometry.length > 0
                ? html`
                    <div class="ml-6 mt-1 text-sm text-gray-600">
                      ${node.geometry.map(
                        (geo) => html`
                          <div class="flex items-center">
                            <span class="w-2 h-[2px] bg-gray-400 mr-2"></span>
                            ${geo.type} (${geo.id})
                          </div>
                        `
                      )}
                    </div>
                  `
                : ""}
              ${node.children.length > 0
                ? renderLayerTree(node.children, state)
                : ""}
            `
          : ""}
      </div>
    `;
  });
}
