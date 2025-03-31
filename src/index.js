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
import { addPathDrawing } from "./events/addPathDrawing.js";

import { deleteGeometry } from "./utils/deleteGeometry.js";

import { hitEsc } from "./utils/hitEsc.js";

import { view } from "./view/view.js";

import { fill } from "./plugins/fill.js";
import { stroke } from "./plugins/stroke.js";
import { testDup } from "./plugins/testDup.js";
import { exportPes } from "./plugins/exportPes.js";

import { evaluateAllLayers } from "./evaluateAllLayers.js";

import { pluginSearch } from "./modals/pluginSearch.js";
import { pluginControlModal } from "./modals/pluginControlModal.js";

import { moveLayer } from "./actions/moveLayer.js";

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
      children: ["LAYER_1"],
      plugins: [stroke.init({ color: "red" })],
      attributes: {},
      outputGeometry: [],
      inputGeometry: [],
    },
    {
      id: "LAYER_1",
      name: "Layer 1",
      parent: "DEFAULT_LAYER",
      children: [],
      plugins: [stroke.init({ color: "black" })],
      attributes: {},
      outputGeometry: [],
      inputGeometry: [],
    },
    {
      id: "LAYER_2",
      name: "Layer 2",
      parent: null,
      children: [],
      plugins: [testDup.init()],
      attributes: {},
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
  adaptiveGrid: true,
  panZoomMethods: null,
  plugins: [fill, stroke, testDup, exportPes],
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
          attributes: {},
          outputGeometry: [],
          inputGeometry: [],
        });
        break;
      }
      case "OPEN_PLUGIN_MODAL": {
        const { pluginId } = args;
        STATE.openPluginModal = pluginId;
        if (pluginId) {
          const container = document.querySelector(
            "[modal-controls-container]"
          );
          container.innerHTML = "";
          pluginControlModal();
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
            attributes: {},
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
    state.geometries.forEach((g) => {
      if (g.type === "point") {
        const x = state.params[g.x];
        const y = state.params[g.y];

        if (!contains(x, y)) return;

        state.selectedGeometry.add(g.id);
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

  addDropUpload((file) => {
    const newState = JSON.parse(file);
    for (const key in newState) {
      state[key] = newState[key];
    }
  });

  addCaching(state);

  renderLoop();

  window.addEventListener("keydown", (e) => {
    if (e.key === "d") {
      hitEsc();
      state.tool = "DRAW";
    }

    if (e.key === "s") {
      state.tool = "SELECT";
    }

    if (e.key === "Escape") {
      if (state.editingPath) {
        state.editingPath = null;
      }
      state.selectedGeometry = new Set();
    }

    if (e.key === "Backspace") {
      deleteGeometry(state);
      evaluateAllLayers();
    }

    if (e.key === "p" && !e.metaKey && !e.ctrlKey) {
      hitEsc();
      state.tool = "DRAW_PATH";
    }
  });
}
