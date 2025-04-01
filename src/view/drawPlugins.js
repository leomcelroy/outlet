import { html } from "lit-html";

export function drawPlugins(state) {
  const activeLayer = state.layers.find((l) => l.id === state.activeLayer);
  const plugins = activeLayer.plugins.map(
    (plugin) => html`
      <div
        class="flex flex-col border-b border-gray-400 relative"
        draggable-plugin
        data-plugin-id="${plugin.id}"
      >
        <div class="flex items-center justify-between p-2">
          <span
            draggable-plugin-trigger
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
          <span class="pl-2 text-sm font-semibold text-gray-800 mr-auto">
            ${plugin.name}
          </span>
          <div class="flex items-center gap-1">
            <button
              @click=${() => {
                state.dispatch({
                  type: "TOGGLE_PLUGIN",
                  pluginId: plugin.id,
                  layerId: activeLayer.id,
                });
              }}
              class="px-2 text-xs ${plugin.enabled
                ? "text-green-600 hover:text-green-800"
                : "text-gray-400 hover:text-gray-600"} cursor-pointer"
            >
              ${plugin.enabled ? "On" : "Off"}
            </button>
            <button
              @click=${() =>
                state.dispatch({
                  type: "OPEN_PLUGIN_MODAL",
                  pluginId: plugin.id,
                })}
              class="px-2 text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Edit
            </button>
            <button
              @click=${() => {
                state.dispatch({
                  type: "REMOVE_PLUGIN",
                  pluginId: plugin.id,
                  layerId: activeLayer.id,
                });
                state.dispatch({ type: "OPEN_PLUGIN_MODAL", pluginId: null });
              }}
              class="text-gray-400 hover:text-red-500 text-sm px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
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
      <div class="overflow-auto flex-1 bg-gray-200 rounded w-full">
        ${plugins}
      </div>
    </div>
  `;
}
