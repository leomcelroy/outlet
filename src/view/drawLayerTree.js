import { html, svg } from "lit-html";
import { getLayerTree } from "../getLayerTree.js";
import { deleteGeometry } from "../utils/deleteGeometry.js";
import { evaluateAllLayers } from "../evaluateAllLayers.js";

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
      <div class="flex-1 overflow-auto bg-gray-200 rounded pb-10 p-2">
        ${renderLayerTree(getLayerTree(), state)}
      </div>
    </div>
  `;
}

function renderLayerTree(tree, state) {
  return tree.map((node) => {
    const isExpanded = state.expandedLayers?.includes(node.id);
    const isActive = state.activeLayer === node.id;

    // Filter out points from the geometry list
    const visibleGeometry = node.geometry.filter((geo) => geo.type !== "point");

    return html`
      <div
        draggable-layer
        draggable
        data-node-id=${node.id}
        class="border-l-2 border-gray-400 my-1"
      >
        <div class="flex items-center">
          <button
            @click=${() =>
              state.dispatch({ type: "TOGGLE_LAYER", layerId: node.id })}
            class="mx-[2.5px] w-3 h-3 text-xs rounded-xs hover:bg-gray-200 cursor-pointer"
          >
            ${isExpanded
              ? svg`<svg width="10" height="10"><path d="M1,3 L9,3 L5,8 Z" fill="currentColor"/></svg>`
              : svg`<svg width="10" height="10"><path d="M3,1 L8,5 L3,9 Z" fill="currentColor"/></svg>`}
          </button>
          <div
            data-active="${isActive}"
            class="font-medium hover:bg-blue-100 px-1 data-[active=true]:bg-blue-200 w-full block cursor-pointer flex justify-between items-center"
          >
            <span
              class="flex-grow truncate"
              @click=${() =>
                state.dispatch({ type: "SET_ACTIVE_LAYER", layerId: node.id })}
              @dblclick=${(e) => {
                if (node.id !== "DEFAULT_LAYER") {
                  changeLayerName(e, state, node);
                }
              }}
            >
              ${node.name}
            </span>
            <div class="flex items-center gap-1">
              ${node.id !== "DEFAULT_LAYER"
                ? html`
                    <button
                      @click=${(e) => {
                        e.stopPropagation();
                        state.dispatch({
                          type: "DELETE_LAYER",
                          layerId: node.id,
                        });
                      }}
                      class="text-gray-400 hover:text-red-500 text-sm px-1 cursor-pointer"
                      title="Delete layer"
                    >
                      ×
                    </button>
                  `
                : ""}
              <span
                draggable-layer-trigger
                class="flex-shrink-0 cursor-move text-gray-500 hover:text-gray-700"
              >
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <circle cx="4" cy="4" r="1.5" />
                  <circle cx="12" cy="4" r="1.5" />
                  <circle cx="4" cy="8" r="1.5" />
                  <circle cx="12" cy="8" r="1.5" />
                  <circle cx="4" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        ${isExpanded
          ? html`
              <div class="ml-4">
                ${visibleGeometry.map(
                  (geo) => html`
                    <div
                      class="hover:bg-blue-100 px-1 cursor-pointer flex items-center justify-between ${state.editingPath ===
                      geo.id
                        ? "bg-blue-100"
                        : ""}"
                      draggable-path
                      data-path-id=${geo.id}
                      @click=${() => {
                        if (geo.type === "path") {
                          state.editingPath = geo.id;
                          state.selectedGeometry = new Set();
                          state.tool = "SELECT";
                        } else {
                          state.selectedGeometry.add(geo.id);
                        }
                      }}
                    >
                      <span>${geo.type} ${geo.id}</span>
                      <div class="flex items-center gap-1">
                        <button
                          @click=${(e) => {
                            e.stopPropagation();
                            state.selectedGeometry = new Set([geo.id]);
                            deleteGeometry(state);
                            evaluateAllLayers();
                          }}
                          class="text-gray-400 hover:text-red-500 text-sm px-1 cursor-pointer"
                          title="Delete path"
                        >
                          ×
                        </button>
                        <span
                          draggable-path-trigger
                          class="flex-shrink-0 cursor-move text-gray-500 hover:text-gray-700"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16">
                            <circle cx="4" cy="4" r="1.5" />
                            <circle cx="12" cy="4" r="1.5" />
                            <circle cx="4" cy="8" r="1.5" />
                            <circle cx="12" cy="8" r="1.5" />
                            <circle cx="4" cy="12" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  `
                )}
                ${node.children.length > 0
                  ? renderLayerTree(node.children, state)
                  : ""}
              </div>
            `
          : ""}
      </div>
    `;
  });
}

function changeLayerName(e, state, node) {
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
}
