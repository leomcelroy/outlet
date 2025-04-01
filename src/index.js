import { render } from "lit-html";
import { addPanZoom } from "./events/addPanZoom.js";
import { addSketching } from "./events/addSketching.js";
import { addPtDragging } from "./events/addPtDragging.js";
import { addLineSelection } from "./events/addLineSelection.js";
import { addSelectionBox } from "./events/addSelectionBox.js";
import { addCaching } from "./events/addCaching.js";
import { addDropUpload } from "./events/addDropUpload.js";
import { addLayerDrag } from "./events/addLayerDrag.js";
import { addPluginDrag } from "./events/addPluginDrag.js";
import { addPathDrag } from "./events/addPathDrag.js";
import { addPathDrawing } from "./events/addPathDrawing.js";
import { addHotKeys } from "./events/addHotKeys.js";
import { moveLayer } from "./actions/moveLayer.js";
import { movePath } from "./actions/movePath.js";
import { view } from "./view/view.js";
import { evaluateAllLayers } from "./evaluateAllLayers.js";
import { pluginSearch } from "./modals/pluginSearch.js";
import { pluginControlModal } from "./modals/pluginControlModal.js";
import { fill } from "./plugins/fill.js";
import { stroke } from "./plugins/stroke.js";
import { testDup } from "./plugins/testDup.js";
import { exportDST } from "./plugins/exportDST.js";
import { demoModal } from "./plugins/customModalDemo.js";
import { bitmap } from "./plugins/bitmap.js";
import { raster } from "./plugins/raster.js";
import { scale } from "./plugins/scale.js";
import { rasterPath } from "./plugins/rasterPath.js";
import { rotate } from "./plugins/rotate.js";
import { translate } from "./plugins/translate.js";
import { align } from "./plugins/align.js";
import { distribute } from "./plugins/distribute.js";

export const STATE = {
  tool: "SELECT",
  params: {},
  selectedGeometry: new Set(),
  geometries: [],
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
  currentPoint: null,
  lineStart: null,
  selectBox: null,
  activeLayer: "DEFAULT_LAYER",
  openPluginModal: null,
  gridSize: 10,
  grid: true,
  adaptiveGrid: false,
  panZoomMethods: null,
  plugins: [
    fill,
    stroke,
    translate,
    rotate,
    scale,
    align,
    distribute,
    testDup,
    // demoModal,
    bitmap,
    raster,
    rasterPath,
    exportDST,
  ],
  currentPath: null,
  editingPath: null,
  dispatch(args) {
    const { type } = args;

    switch (type) {
      case "SET_ACTIVE_LAYER": {
        const { layerId } = args;
        STATE.activeLayer = layerId;
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
        const { sourceId, targetId, position } = args;
        moveLayer(args);
        break;
      }
      case "MOVE_PATH_TO_LAYER": {
        const { pathId, targetLayerId } = args;
        movePath(args);
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
        STATE.editingPath = null;
        STATE.selectedGeometry = new Set();
        STATE.currentPath = null;
        STATE.currentPoint = null;
        STATE.lineStart = null;
        STATE.geometries = [];
        STATE.params = {};
        STATE.layers = [
          {
            id: "DEFAULT_LAYER",
            name: "Default Layer",
            parent: null,
            children: [],
            plugins: [stroke.init({ color: "black" })],
            outputGeometry: [],
            inputGeometry: [],
          },
        ];
        STATE.activeLayer = "DEFAULT_LAYER";
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
        // Don't allow deleting the default layer
        if (layerId === "DEFAULT_LAYER") return;

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
          STATE.activeLayer = "DEFAULT_LAYER";
        }

        STATE.dispatch({ type: "OPEN_PLUGIN_MODAL", pluginId: null });
        STATE.currentPath = null;
        STATE.editingPath = null;

        evaluateAllLayers();
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

  addSketching(sketchBoard, state);
  addPtDragging(sketchBoard, state);
  addLineSelection(sketchBoard, state);
  addPathDrawing(sketchBoard, state);

  addSelectionBox(sketchBoard, state, ({ contains, selectBox }) => {
    // Get the current editing path and its points
    const editingPath = state.geometries.find(
      (g) => g.id === state.editingPath
    );
    const editingPathPoints = new Set();

    if (editingPath) {
      editingPath.data.forEach((cmd) => {
        if (cmd.point) {
          editingPathPoints.add(cmd.point);
        }
        if (cmd.control1) {
          editingPathPoints.add(cmd.control1);
        }
        if (cmd.control2) {
          editingPathPoints.add(cmd.control2);
        }
      });
    }

    state.geometries.forEach((g) => {
      if (state.editingPath) {
        // When editing a path, only select points
        if (g.type === "point" && editingPathPoints.has(g.id)) {
          const x = state.params[g.x];
          const y = state.params[g.y];

          if (!contains(x, y)) return;

          state.selectedGeometry.add(g.id);
        }
      } else {
        // When not editing a path, select all geometry types
        if (g.type === "point") {
          const x = state.params[g.x];
          const y = state.params[g.y];
          if (contains(x, y)) {
            state.selectedGeometry.add(g.id);
          }
        } else if (g.type === "line") {
          const p1 = state.geometries.find((p) => p.id === g.p1);
          const p2 = state.geometries.find((p) => p.id === g.p2);
          if (p1 && p2) {
            const x1 = state.params[p1.x];
            const y1 = state.params[p1.y];
            const x2 = state.params[p2.x];
            const y2 = state.params[p2.y];

            // Check if either endpoint is in the selection box
            if (contains(x1, y1) || contains(x2, y2)) {
              state.selectedGeometry.add(g.id);
            }
          }
        } else if (g.type === "path") {
          // For paths, check if any point in the path is in the selection box
          const hasPointInBox = g.data.some((cmd) => {
            if (!cmd.point) return false;
            const point = state.geometries.find((p) => p.id === cmd.point);
            if (!point) return false;
            const x = state.params[point.x];
            const y = state.params[point.y];
            return contains(x, y);
          });

          if (hasPointInBox) {
            state.selectedGeometry.add(g.id);
          }
        }
      }
    });
  });

  sketchBoard.addEventListener("wheel", () => {
    function getBaseLog(x, y) {
      return Math.log(y) / Math.log(x);
    }

    if (!state.panZoomMethods) return;

    const corners = state.panZoomMethods.corners();

    const xLimits = [corners.lt[0], corners.rt[0]];
    const xRange = Math.abs(xLimits[1] - xLimits[0]);
    const yLimits = [corners.lb[1], corners.lt[1]];
    const yRange = Math.abs(yLimits[1] - yLimits[0]);

    // Calculate a reasonable grid size based on the current zoom level
    const order = Math.round(getBaseLog(10, Math.max(xRange, yRange)));
    // Use powers of 10 for more intuitive scaling (1, 10, 100, etc.)
    // Divide by 10 to get more reasonable intermediate values
    const stepSize = state.adaptiveGrid
      ? Math.max(1, 10 ** order / 10)
      : state.gridSize;
    state.gridSize = stepSize;
  });

  addLayerDrag(state);
  addPluginDrag(state);
  addPathDrag(state);

  addDropUpload((file) => {
    const newState = JSON.parse(file);
    for (const key in newState) {
      state[key] = newState[key];
    }
    evaluateAllLayers();
  });

  addCaching(state);
  addHotKeys(state);

  renderLoop();
}
