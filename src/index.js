import { render } from "lit-html";
import { addPanZoom } from "./events/addPanZoom.js";
import { addEdgeDrawing } from "./events/addEdgeDrawing.js";
import { addPtDragging } from "./events/addPtDragging.js";
import { addEdgeSelection } from "./events/addEdgeSelection.js";
import { addSelectionBox } from "./events/addSelectionBox.js";
import { addCaching } from "./events/addCaching.js";
import { addDropUpload } from "./events/addDropUpload.js";
import { addLayerDrag } from "./events/addLayerDrag.js";
import { addPluginDrag } from "./events/addPluginDrag.js";
import { addHotKeys } from "./events/addHotKeys.js";
import { addAdaptiveGrid } from "./events/addAdaptiveGrid.js";
import { moveLayer } from "./actions/moveLayer.js";
import { duplicateLayer } from "./actions/duplicateLayer.js";
import { view } from "./view/view.js";

import { evaluateAllLayers } from "./utils/evaluateAllLayers.js";
import { clearEdgeStartIfNoConnections } from "./utils/clearEdgeStartIfNoConnections.js";
import { getDefaultLayer } from "./utils/getDefaultLayer.js";
import { duplicateAndReidentify } from "./utils/duplicateAndReidentify.js";

import { pluginSearch } from "./modals/pluginSearch.js";
import { pluginControlModal } from "./modals/pluginControlModal.js";

import { fill } from "./plugins/fill.js";
import { stroke } from "./plugins/stroke.js";
import { testDup } from "./plugins/testDup.js";
import { exportDST } from "./plugins/exportDST.js";
import { demoModal } from "./plugins/customModalDemo.js";
import { bitmap } from "./plugins/bitmap.js";
import { raster } from "./plugins/raster.js";
import { rasterFill } from "./plugins/rasterFill.js";
import { scale } from "./plugins/scale.js";
import { rasterPath } from "./plugins/rasterPath.js";
import { rotate } from "./plugins/rotate.js";
import { translate } from "./plugins/translate.js";
import { align } from "./plugins/align.js";
import { distribute } from "./plugins/distribute.js";
import { hide } from "./plugins/hide.js";
import { satinFill } from "./plugins/satinFill.js";
import { colorCode } from "./plugins/colorCode.js";
import { scaleToRect } from "./plugins/scaleToRect.js";

export const STATE = {
  tool: "SELECT",
  params: {},
  selectedGeometry: new Set(),
  geometries: [],
  clipboard: null,
  layers: [
    {
      id: "DEFAULT_LAYER",
      name: "Default Layer",
      parent: null,
      children: [],
      plugins: [],
      outputGeometry: [],
      inputGeometry: [],
    },
  ],
  selectBox: null,
  activeLayer: "DEFAULT_LAYER",
  openPluginModal: null,
  gridSize: 10,
  grid: true,
  adaptiveGrid: false,
  showBaseGeometry: true,
  panZoomMethods: null,
  plugins: [
    fill,
    stroke,
    translate,
    rotate,
    scale,
    align,
    distribute,
    // testDup,
    // demoModal,
    bitmap,
    //raster,
    rasterFill,
    rasterPath,
    // satinFill,
    hide,
    colorCode,
    scaleToRect,

    // TRIGGERS
    exportDST,
  ],

  currentPoint: null,
  edgeStart: null,

  dispatch(args) {
    const { type } = args;

    switch (type) {
      case "SET_ACTIVE_LAYER": {
        const { layerId } = args;
        clearEdgeStartIfNoConnections(STATE);

        // Reset the current point and edge start
        STATE.currentPoint = null;
        STATE.edgeStart = null;
        STATE.selectedGeometry = new Set();

        // Set the new layer as active
        STATE.activeLayer = layerId;

        STATE.dispatch({ type: "OPEN_PLUGIN_MODAL", pluginId: null });
        break;
      }
      case "EVALUATE_LAYERS": {
        evaluateAllLayers();
        break;
      }
      case "TOGGLE_LAYER": {
        const { layerId } = args;
        if (!STATE.expandedLayers) {
          STATE.expandedLayers = [];
        }
        const index = STATE.expandedLayers.indexOf(layerId);
        if (index === -1) {
          STATE.expandedLayers.push(layerId);
        } else {
          STATE.expandedLayers.splice(index, 1);
        }
        break;
      }
      case "ADD_LAYER": {
        const newId = `LAYER_${STATE.layers.length + 1}`;
        STATE.layers.push({
          id: newId,
          name: `Layer ${STATE.layers.length + 1}`,
          parent: null,
          children: [],
          plugins: [],
          outputGeometry: [],
          inputGeometry: [],
        });

        // Reset the current point and edge start
        clearEdgeStartIfNoConnections(STATE);
        STATE.currentPoint = null;
        STATE.edgeStart = null;

        // Set the new layer as active
        STATE.activeLayer = newId;
        break;
      }
      case "OPEN_PLUGIN_MODAL": {
        const { pluginId } = args;
        STATE.openPluginModal = pluginId;
        const container = document.querySelector("[modal-controls-container]");
        container.innerHTML = "";

        if (pluginId) {
          const activeLayer = STATE.layers.find(
            (layer) => layer.id === STATE.activeLayer
          );

          const plugin = activeLayer.plugins.find(
            (plugin) => plugin.id === pluginId
          );

          const pluginType = STATE.plugins.find((p) => p.type === plugin.type);

          if (pluginType.customModal) {
            const updateControl = (controlId, value) => {
              STATE.dispatch({
                type: "UPDATE_PLUGIN_CONTROL",
                pluginId,
                controlId,
                value,
              });
            };

            const close = () => {
              STATE.dispatch({ type: "OPEN_PLUGIN_MODAL", pluginId: null });
              container.innerHTML = "";
            };

            console.log(plugin.controls);

            pluginType.customModal({
              container,
              updateControl,
              close,
              controls: plugin.controls,
            });
          } else {
            pluginControlModal();
          }
        }
        break;
      }
      case "REMOVE_PLUGIN": {
        const { pluginId, layerId } = args;
        const layer = STATE.layers.find((layer) => layer.id === layerId);
        layer.plugins = layer.plugins.filter(
          (plugin) => plugin.id !== pluginId
        );
        evaluateAllLayers();
        STATE.openPluginModal = null;
        STATE.dispatch({ type: "OPEN_PLUGIN_MODAL", pluginId: null });
        break;
      }
      case "ADD_PLUGIN": {
        pluginSearch();
        break;
      }
      case "UPDATE_PLUGIN_CONTROL": {
        const { pluginId, controlId, value } = args;
        const layer = STATE.layers.find(
          (layer) => layer.id === STATE.activeLayer
        );
        const plugin = layer.plugins.find((plugin) => plugin.id === pluginId);
        const control = plugin.controls.find(
          (control) => control.id === controlId
        );
        if (control) {
          control.value = value;
          evaluateAllLayers();
        }

        break;
      }
      case "SET_LAYER_NAME": {
        let { layerId, name } = args;
        if (name.length === 0) {
          name = "ANON";
        }
        const layer = STATE.layers.find((layer) => layer.id === layerId);
        layer.name = name;
        break;
      }
      case "MOVE_LAYER": {
        moveLayer(args);
        break;
      }
      case "MOVE_PLUGIN": {
        const { sourceId, targetId, position } = args;
        const activeLayer = STATE.layers.find(
          (l) => l.id === STATE.activeLayer
        );
        const sourceIndex = activeLayer.plugins.findIndex(
          (p) => p.id === sourceId
        );
        const targetIndex = activeLayer.plugins.findIndex(
          (p) => p.id === targetId
        );

        if (sourceIndex === -1 || targetIndex === -1) break;

        // Remove the plugin from its current position
        const [plugin] = activeLayer.plugins.splice(sourceIndex, 1);

        // Insert it at the new position
        const insertIndex =
          position === "before" ? targetIndex : targetIndex + 1;
        activeLayer.plugins.splice(insertIndex, 0, plugin);

        evaluateAllLayers();
        break;
      }
      case "TOGGLE_PLUGIN": {
        const { pluginId, layerId } = args;
        const layer = STATE.layers.find((layer) => layer.id === layerId);
        const plugin = layer.plugins.find((plugin) => plugin.id === pluginId);
        if (plugin) {
          plugin.enabled = !plugin.enabled;
          evaluateAllLayers();
        }
        break;
      }
      case "CLEAR": {
        STATE.selectedGeometry = new Set();

        STATE.currentPoint = null;
        STATE.edgeStart = null;

        STATE.geometries = [];
        STATE.params = {};
        STATE.layers = [
          {
            id: "DEFAULT_LAYER",
            name: "Default Layer",
            parent: null,
            children: [],
            plugins: [],
            outputGeometry: [],
            inputGeometry: [],
          },
        ];
        STATE.activeLayer = getDefaultLayer().id;
        evaluateAllLayers();

        // Save the cleared state to cache
        const file = JSON.stringify({
          geometries: STATE.geometries,
          params: STATE.params,
          layers: STATE.layers,
        });
        sessionStorage.setItem("sketchState", file);
        break;
      }
      case "DELETE_LAYER": {
        const { layerId } = args;

        // Find the layer to delete
        const layerIndex = STATE.layers.findIndex((l) => l.id === layerId);
        if (layerIndex === -1) return;

        // Remove layer from parent's children if it has a parent
        const layer = STATE.layers[layerIndex];
        if (layer.parent) {
          const parent = STATE.layers.find((l) => l.id === layer.parent);
          if (parent) {
            parent.children = parent.children.filter((id) => id !== layerId);
          }
        }

        // Delete all geometries in this layer
        STATE.geometries = STATE.geometries.filter((g) => g.layer !== layerId);

        // Remove the layer
        STATE.layers.splice(layerIndex, 1);

        // If the deleted layer was active, set active layer to default
        if (STATE.activeLayer === layerId) {
          STATE.activeLayer = getDefaultLayer().id;
        }

        STATE.dispatch({ type: "OPEN_PLUGIN_MODAL", pluginId: null });

        STATE.currentPoint = null;
        STATE.edgeStart = null;

        evaluateAllLayers();
        break;
      }
      case "DUPLICATE_LAYER": {
        duplicateLayer();
        break;
      }
      case "SET_TOOL": {
        const { tool } = args;

        clearEdgeStartIfNoConnections(STATE);
        STATE.currentPoint = null;
        STATE.edgeStart = null;
        STATE.selectedGeometry = new Set();

        STATE.tool = tool;
        break;
      }
      default:
        console.log("Unknown event:", type);
        break;
    }
  },
};

export function patchState(callback = null) {
  if (callback) callback(STATE);

  // window.requestAnimationFrame(() => {
  //   render(view(STATE), document.body);
  // });
}

function renderLoop() {
  requestAnimationFrame(() => {
    render(view(STATE), document.body);
    renderLoop();
  });
}

export function init() {
  console.log("init");
  const state = STATE;

  window.G = {
    state,
    patchState,
  };

  render(view(state), document.body);

  const sketchBoard = document.querySelector("[sketch-board]");

  const panZoomMethods = addPanZoom(sketchBoard);
  state.panZoomMethods = panZoomMethods;

  addEdgeDrawing(sketchBoard, state);
  addPtDragging(sketchBoard, state);
  addEdgeSelection(sketchBoard, state);
  addAdaptiveGrid(sketchBoard, state);

  addSelectionBox(sketchBoard, state, ({ contains, selectBox }) => {
    // Select points that are inside the box and on the active layer
    state.geometries.forEach((geo) => {
      if (geo.type === "point" && geo.layer === state.activeLayer) {
        const x = state.params[geo.x];
        const y = state.params[geo.y];
        if (contains(x, y)) {
          state.selectedGeometry.add(geo.id);
        }
      }
    });
  });

  addLayerDrag(state);
  addPluginDrag(state);

  addDropUpload((file) => {
    const newState = JSON.parse(file);

    // Duplicate and reidentify the imported state
    const duplicated = duplicateAndReidentify(newState);

    // Update state with duplicated data
    state.layers = [...state.layers, ...duplicated.layers];
    state.geometries = [...state.geometries, ...duplicated.geometries];
    state.params = { ...state.params, ...duplicated.params };

    evaluateAllLayers();
  });

  addCaching(state);
  addHotKeys(state);

  renderLoop();
}
