import { html } from "lit-html";

export function drawPlugins(state) {
  const activeLayer = state.layers.find((l) => l.id === state.activeLayer);
  const plugins = activeLayer.plugins.map(
    (plugin) => html`
      <div class="plugin-item flex flex-col border-b border-gray-200 relative">
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
          class="max-w-full bg-white shadow-md m-2 p-2 rounded-md ${state.openPluginModal ===
          plugin.id
            ? ""
            : "hidden"}"
        >
          ${plugin.controls.map((control) => {
            switch (control.type) {
              case "color":
                return html`
                  <div class="flex items-center justify-between mb-2">
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
                  <div class="flex items-center justify-between mb-2">
                    <label
                      for="string-${control.id}"
                      class="text-sm font-medium text-gray-700"
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
                      class="border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm px-2 py-1 w-3/5"
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
                  <div class="flex items-center justify-between mb-2">
                    <label
                      for="boolean-${control.id}"
                      class="text-sm font-medium text-gray-700"
                    >
                      ${control.id}
                    </label>
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
    <div class="flex flex-col flex-1 w-full overflow-hidden mt-3">
      <div class="flex justify-between items-center mb-4">
        <div class="text-lg font-bold">Active Layer Plugins</div>
        <button
          @click=${() => state.dispatch({ type: "ADD_PLUGIN" })}
          class="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + New Plugin
        </button>
      </div>
      <div class="overflow-scroll flex-1 bg-gray-200 rounded w-full">
        ${plugins}
      </div>
    </div>
  `;
}
