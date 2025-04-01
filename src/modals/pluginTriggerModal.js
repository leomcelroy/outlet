import { html, render } from "lit-html";
import { STATE } from "../index.js";
import { evaluateAllLayers } from "../evaluateAllLayers.js";

export function pluginTriggerModal(plugin, layer) {
  const process = plugin.process;
  plugin = plugin.init();

  // Create a container div and append it to the body
  const container = document.createElement("div");
  document.body.appendChild(container);

  const remove = () => {
    container.remove();
  };

  // Store control values locally
  const controlValues = {};

  // Initialize control values from plugin
  if (plugin && plugin.controls) {
    plugin.controls.forEach((control) => {
      controlValues[control.id] = control.value;
    });
  }

  // Function to update and render the modal
  const update = () => {
    if (!plugin) {
      remove();
      return;
    }

    const template = html`
      <div
        class="fixed inset-0 bg-[#6a728273] flex justify-center items-center"
        @click=${(e) => {
          // Close modal if clicked outside the modal content
          if (e.target.classList.contains("fixed")) {
            remove();
          }
        }}
      >
        <div
          class="bg-white p-3 rounded shadow-md w-full max-w-md relative flex flex-col"
          style="margin-top: 0; transform: translateY(0);"
        >
          <h3 class="text-lg font-bold mb-4">${plugin.name}</h3>
          <div class="overflow-y-auto max-h-[60vh]">
            ${plugin.controls.map((control) => {
              switch (control.type) {
                case "color":
                  return html`
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-gray-700">
                        Color
                      </span>
                      <input
                        type="color"
                        .value=${controlValues[control.id]}
                        @input=${(e) => {
                          controlValues[control.id] = e.target.value;
                        }}
                        class="w-8 h-8 border border-gray-300 rounded-md"
                      />
                    </div>
                  `;
                case "string":
                  return html`
                    <div class="flex items-center justify-between mb-2">
                      <label
                        for="string-${control.id}"
                        class="text-sm font-medium text-gray-700"
                        >${control.label || control.id}</label
                      >
                      <input
                        type="text"
                        id="string-${control.id}"
                        .value=${controlValues[control.id]}
                        @input=${(e) => {
                          controlValues[control.id] = e.target.value;
                        }}
                        class="border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm px-2 py-1 w-3/5"
                      />
                    </div>
                  `;
                case "number":
                  return html`
                    <div class="flex items-center justify-between mb-2">
                      <label
                        for="number-${control.id}"
                        class="text-sm font-medium text-gray-700"
                        >${control.label || control.id}</label
                      >
                      <input
                        type="number"
                        id="number-${control.id}"
                        .value=${controlValues[control.id]}
                        @input=${(e) => {
                          controlValues[control.id] = Number(e.target.value);
                        }}
                        class="border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm px-2 py-1 w-3/5"
                      />
                    </div>
                  `;
                case "slider":
                  return html`
                    <div class="flex items-center justify-between mb-2">
                      <label
                        for="slider-${control.id}"
                        class="text-sm font-medium text-gray-700"
                        >${control.label || control.id}</label
                      >
                      <input
                        type="range"
                        id="slider-${control.id}"
                        min="0"
                        max="100"
                        .value=${controlValues[control.id]}
                        @input=${(e) => {
                          controlValues[control.id] = Number(e.target.value);
                        }}
                        class="w-3/5"
                      />
                    </div>
                  `;
                case "select":
                  return html`
                    <div class="flex items-center justify-between mb-2">
                      <label
                        for="select-${control.id}"
                        class="text-sm font-medium text-gray-700"
                        >${control.label || control.id}</label
                      >
                      <select
                        id="select-${control.id}"
                        @change=${(e) => {
                          controlValues[control.id] = e.target.value;
                        }}
                        class="border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm px-2 py-1 w-3/5"
                      >
                        ${control.options.map(
                          (option) => html`
                            <option
                              value=${option}
                              ?selected=${controlValues[control.id] === option}
                            >
                              ${option}
                            </option>
                          `
                        )}
                      </select>
                    </div>
                  `;
                case "boolean":
                  return html`
                    <div class="flex items-center justify-between mb-2">
                      <label
                        for="boolean-${control.id}"
                        class="text-sm font-medium text-gray-700"
                        >${control.label || control.id}</label
                      >
                      <input
                        id="boolean-${control.id}"
                        type="checkbox"
                        class="form-checkbox h-5 w-5 text-blue-500"
                        ?checked=${controlValues[control.id]}
                        @change=${(e) => {
                          controlValues[control.id] = e.target.checked;
                        }}
                      />
                    </div>
                  `;
                default:
                  return html``;
              }
            })}
          </div>
          <div class="mt-4 pt-3 border-t border-gray-200 flex justify-between">
            <button
              @click=${() => {
                remove();
              }}
              class="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              @click=${() => {
                process(controlValues, layer.outputGeometry);

                // evaluateAllLayers();
                remove();
              }}
              class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              Run
            </button>
          </div>
        </div>
      </div>
    `;
    render(template, container);
  };

  update();
}
