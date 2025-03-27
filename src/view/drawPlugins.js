import { html } from "lit-html";

export function drawPlugins(state) {
    const activeLayer = state.layers.find(l => l.id === state.activeLayer);
    const plugins = activeLayer.plugins.map(plugin => html`
        <div class="plugin-item flex items-center justify-between p-2 border-b border-gray-200 relative">
            <span class="plugin-name text-sm font-semibold">${plugin.name}</span>
            <button @click=${() => state.dispatch({ type: 'OPEN_PLUGIN_MODAL', pluginId: plugin.id })} class="ml-4">
                Edit
            </button>
            <div class="absolute left-0 top-0 w-64 bg-white shadow p-4 ${state.openPluginModal === plugin.id ? 'block' : 'hidden'}">
                ${plugin.controls.map(control => {
                    switch (control.type) {
                        case "color":
                            return html`
                                <div class="mb-2">
                                    <label for="color" class="block text-sm font-medium text-gray-700">Color</label>
                                    <input type="color" id="color" name="color" .value=${control.value} @input=${(e) => state.dispatch({ type: 'UPDATE_PLUGIN_CONTROL', pluginId: plugin.id, controlId: control.id, value: e.target.value })} class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                </div>
                            `;
                        case "string":
                            return html`
                                <div class="mb-2">
                                    <label for="string" class="block text-sm font-medium text-gray-700">String</label>
                                    <input type="text" id="string" name="string" .value=${control.value} @input=${(e) => state.dispatch({ type: 'UPDATE_PLUGIN_CONTROL', pluginId: plugin.id, controlId: control.id, value: e.target.value })} class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                </div>
                            `;
                        case "number":
                            return html`
                                <div class="mb-2">
                                    <label for="number" class="block text-sm font-medium text-gray-700">Number</label>
                                    <input type="number" id="number" name="number" .value=${control.value} @input=${(e) => state.dispatch({ type: 'UPDATE_PLUGIN_CONTROL', pluginId: plugin.id, controlId: control.id, value: e.target.value })} class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                </div>
                            `;
                        case "slider":
                            return html`
                                <div class="mb-2">
                                    <label for="slider" class="block text-sm font-medium text-gray-700">Slider</label>
                                    <input type="range" id="slider" name="slider" min="0" max="100" .value=${control.value} @input=${(e) => state.dispatch({ type: 'UPDATE_PLUGIN_CONTROL', pluginId: plugin.id, controlId: control.id, value: e.target.value })} class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                </div>
                            `;
                        case "select":
                            return html`
                                <div class="mb-2">
                                    <label for="select" class="block text-sm font-medium text-gray-700">Select</label>
                                    <select id="select" name="select" @change=${(e) => state.dispatch({ type: 'UPDATE_PLUGIN_CONTROL', pluginId: plugin.id, controlId: control.id, value: e.target.value })} class="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                        ${control.options.map(option => html`
                                            <option value=${option.value} ${control.value === option.value ? 'selected' : ''}>${option.text}</option>
                                        `)}
                                    </select>
                                </div>
                            `;
                        case "boolean":
                            return html`
                                <div class="mb-2">
                                    <label for="boolean" class="inline-flex items-center cursor-pointer">
                                        <input id="boolean" type="checkbox" class="form-checkbox h-5 w-5 text-gray-600 transition duration-150 ease-in-out" ${control.value ? 'checked' : ''} @change=${(e) => state.dispatch({ type: 'UPDATE_PLUGIN_CONTROL', pluginId: plugin.id, controlId: control.id, value: e.target.checked })}>
                                        <span class="ml-3 text-gray-700 sm:text-sm">${control.label}</span>
                                    </label>
                                </div>
                            `;
                        default:
                            return html``;
                    }
                })}
            </div>
        </div>
    `);
    
    return html`
    <div class="max-height-[40%]">
        <div class="text-lg font-bold mt-4">Active Layer Plugins</div>
        ${plugins}
    </div>
    `;
}