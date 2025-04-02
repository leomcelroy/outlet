import { STATE } from "../index.js";
import { evaluateAllLayers } from "../utils/evaluateAllLayers.js";
import { html, render } from "lit-html";
import { pluginTriggerModal } from "./pluginTriggerModal.js";

export function pluginSearch() {
  const modalContainer = document.querySelector("[modal-controls-container]");
  modalContainer.innerHTML = "";

  // Create a container div and append it to the body
  const container = document.createElement("div");
  modalContainer.appendChild(container);

  // Function to update the view
  const update = () => {
    const searchQuery = STATE.searchQuery || "";
    const filteredPlugins = STATE.plugins.filter((plugin) =>
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const template = html`
      <div
        class="fixed inset-0 bg-[#6a728273] flex justify-center items-center"
        @click=${(e) => {
          // Close modal if clicked outside the modal content
          if (e.target.classList.contains("fixed")) {
            container.remove();
          }
        }}
      >
        <div
          class="bg-white p-6 rounded shadow-md w-full max-w-md relative flex flex-col h-100 overflow-auto"
          style="margin-top: 0; transform: translateY(0);"
        >
          <div class="mb-4">
            <input
              type="text"
              class="w-full p-2 border border-gray-300 rounded"
              placeholder="Search plugins..."
              .value=${searchQuery}
              @input=${(e) => {
                STATE.searchQuery = e.target.value;
                update(); // Re-render the template after updating the state
              }}
            />
          </div>
          <div
            class="overflow-y-scroll max-h-[60vh]"
            style="min-height: 200px;"
          >
            ${filteredPlugins.map(
              (plugin) => html`
                <div
                  class="flex justify-between items-center border-b border-gray-200 py-2"
                >
                  <span>${plugin.name}</span>
                  <button
                    class="${plugin.applyOnce
                      ? "px-3 py-1 bg-orange-500 border border-orange-500 text-white rounded hover:bg-orange-600"
                      : "px-3 py-1 bg-blue-500 border border-blue-500 text-white rounded hover:bg-blue-600"}"
                    @click=${() => {
                      const activeLayer = STATE.layers.find(
                        (layer) => layer.id === STATE.activeLayer
                      );

                      container.remove();

                      if (plugin.applyOnce) {
                        pluginTriggerModal(plugin, activeLayer);
                      } else {
                        activeLayer.plugins.push(plugin.init());
                        evaluateAllLayers();
                      }
                    }}
                  >
                    ${plugin.applyOnce ? "Trigger" : "Apply"}
                  </button>
                </div>
              `
            )}
            <div class="h-16"></div>
          </div>
          <div
            class="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style="background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.8), rgba(255,255,255,1));"
          ></div>
        </div>
      </div>
    `;
    render(template, container);
  };

  STATE.searchQuery = "";

  update();

  container.querySelector("input").focus();
}
