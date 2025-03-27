import { html } from "lit-html";

export function drawPlugins(state) {
  const activeLayer = state.layers.find((l) => l.id === state.activeLayer);
  const plugins = activeLayer.plugins.map(
    (plugin) => html`
      <div
        class="plugin-item flex flex-col border-b border-gray-200 relative mb-4"
      >
        <div class="flex items-center justify-between p-2">
          <span class="plugin-name text-sm font-semibold text-gray-800">
            ${plugin.name}
          </span>
          <button
            @click=${() =>
              state.dispatch({
                type: "OPEN_PLUGIN_MODAL",
                pluginId: plugin.id,
              })}
            class="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
          >
            Edit
          </button>
        </div>
        <div
          class="w-full bg-white shadow-md p-4 rounded-md ${state.openPluginModal ===
          plugin.id
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"}"
        >
          ${plugin.controls.map((control) => {
            switch (control.type) {
              case "color":
                return html`
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="text-sm font-medium text-gray-700">Color</span>
                    <input
                      type="color"
                      .value=${control.value}
                      @input=${(e) =>
                        state.dispatch({
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
                  <div class="mb-2">
                    <label
                      for="string-${control.id}"
                      class="block text-sm font-medium text-gray-700"
                      >String</label
                    >
                    <input
                      type="text"
                      id="string-${control.id}"
                      .value=${control.value}
                      @input=${(e) =>
                        state.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: e.target.value,
                        })}
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm px-2 py-1"
                    />
                  </div>
                `;
              case "number":
                return html`
                  <div class="mb-2">
                    <label
                      for="number-${control.id}"
                      class="block text-sm font-medium text-gray-700"
                      >Number</label
                    >
                    <input
                      type="number"
                      id="number-${control.id}"
                      .value=${control.value}
                      @input=${(e) =>
                        state.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: e.target.value,
                        })}
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm px-2 py-1"
                    />
                  </div>
                `;
              case "slider":
                return html`
                  <div class="mb-2">
                    <label
                      for="slider-${control.id}"
                      class="block text-sm font-medium text-gray-700"
                      >Slider</label
                    >
                    <input
                      type="range"
                      id="slider-${control.id}"
                      min="0"
                      max="100"
                      .value=${control.value}
                      @input=${(e) =>
                        state.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: e.target.value,
                        })}
                      class="mt-1 block w-full"
                    />
                  </div>
                `;
              case "select":
                return html`
                  <div class="mb-2">
                    <label
                      for="select-${control.id}"
                      class="block text-sm font-medium text-gray-700"
                      >Select</label
                    >
                    <select
                      id="select-${control.id}"
                      @change=${(e) =>
                        state.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: e.target.value,
                        })}
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm px-2 py-1"
                    >
                      ${control.options.map(
                        (option) => html`
                          <option
                            value=${option}
                            ${control.value === option ? "selected" : ""}
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
                  <div class="mb-2 flex items-center">
                    <input
                      id="boolean-${control.id}"
                      type="checkbox"
                      class="form-checkbox h-5 w-5 text-blue-500"
                      ${control.value ? "checked" : ""}
                      @change=${(e) =>
                        state.dispatch({
                          type: "UPDATE_PLUGIN_CONTROL",
                          pluginId: plugin.id,
                          controlId: control.id,
                          value: e.target.checked,
                        })}
                    />
                    <label
                      for="boolean-${control.id}"
                      class="ml-3 text-sm font-medium text-gray-700"
                    >
                      ${control.id}
                    </label>
                  </div>
                `;
              default:
                return html``;
            }
          })}
        </div>
      </div>
    `
  );

  return html`
    <div class="max-h-[40%] p-4">
      <div class="text-lg font-bold mt-4 mb-2 text-gray-800">
        Active Layer Plugins
      </div>
      ${plugins}
    </div>
  `;
}
