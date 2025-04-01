import { html, render } from "lit-html";
import { STATE } from "../index.js";

export function pluginControlModal() {
  // Create a container div and append it to the body
  const metaContainer = document.querySelector("[modal-controls-container]");
  const container = document.createElement("div");
  metaContainer.append(container);

  const remove = () => {
    container.remove();
  };

  const activeLayer = STATE.layers.find(
    (layer) => layer.id === STATE.activeLayer
  );

  // Function to update and render the modal
  const update = () => {
    // Find the plugin that is being edited based on STATE.openPluginModal
    const plugin = activeLayer.plugins.find(
      (p) => p.id === STATE.openPluginModal
    );
    // If no plugin is selected, remove the container and exit
    if (!plugin) {
      remove();
      return;
    }

    const template = html`
      <div
        class="m-2 border rounded border-gray-300 flex justify-center items-center min-w-40"
      >
        <div class="bg-white p-6 rounded shadow-md relative w-full max-w-md">
          <button
            @click=${() => {
              STATE.dispatch({ type: "OPEN_PLUGIN_MODAL", pluginId: null });
              remove();
            }}
            class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
          <h3 class="text-lg font-bold mb-4">${plugin.name}</h3>
          ${plugin.controls.map((control) => {
            switch (control.type) {
              case "color":
                return html`
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">
                      ${control.label || control.id}
                    </span>
                    <input
                      type="color"
                      .value=${control.value}
                      @input=${(e) =>
                        STATE.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: e.target.value,
                        })}
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
                      .value=${control.value}
                      @input=${(e) =>
                        STATE.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: e.target.value,
                        })}
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
                      .value=${control.value}
                      @input=${(e) =>
                        STATE.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: Number(e.target.value),
                        })}
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
                      .value=${control.value}
                      @input=${(e) =>
                        STATE.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: Number(e.target.value),
                        })}
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
                      @change=${(e) =>
                        STATE.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: e.target.value,
                        })}
                      class="border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm px-2 py-1 w-3/5"
                    >
                      ${control.options.map(
                        (option) => html`
                          <option
                            value=${option}
                            ?selected=${control.value === option}
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
                      ?checked=${control.value}
                      @change=${(e) =>
                        STATE.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: e.target.checked,
                        })}
                    />
                  </div>
                `;
              default:
                return html``;
            }
          })}
        </div>
      </div>
    `;
    render(template, container);
  };

  update();
}
