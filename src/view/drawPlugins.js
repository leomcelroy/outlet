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
