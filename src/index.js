import { render } from "lit-html";

import { addPanZoom } from "./events/addPanZoom.js";
import { addSketching } from "./events/addSketching.js";
import { addPtDragging } from "./events/addPtDragging.js";
import { addLineSelection } from "./events/addLineSelection.js";
import { addSelectionBox } from "./events/addSelectionBox.js";
import { addCaching } from "./events/addCaching.js";
import { addDropUpload } from "./events/addDropUpload.js";
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
        if (pluginId) pluginControlModal();
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

        const targetLayer = STATE.layers.find((layer) => layer.id === targetId);
        const targetLayerParent = STATE.layers.find(
          (layer) => layer.id === targetLayer.parent
        );
        const movedLayer = STATE.layers.find((layer) => layer.id === sourceId);
        const movedLayerParent = STATE.layers.find(
          (layer) => layer.id === movedLayer.parent
        );

        console.log(sourceId);

        // Remove the moved layer from its parent
        if (movedLayerParent) {
          movedLayerParent.children = movedLayerParent.children.filter(
            (child) => child !== movedLayer.id
          );
        }

        let targetLayerIndex;
        if (targetLayerParent) {
          targetLayerIndex = targetLayerParent.children.indexOf(targetLayer.id);
        } else {
          targetLayerIndex = STATE.layers.indexOf(targetLayer);
        }

        console.log(targetLayerIndex);
        if (position === "inside") {
          // Make it a child of the target; we don't care about the index
          targetLayer.children.push(movedLayer.id);
          movedLayer.parent = targetLayer.id;
        } else {
          // Insert before or after the target
          const insertIndex =
            position === "before" ? targetLayerIndex : targetLayerIndex + 1;
          console.log("inserting at", insertIndex);

          if (targetLayerParent) {
            targetLayerParent.children.splice(insertIndex, 0, movedLayer.id);
            movedLayer.parent = targetLayerParent.id;
          } else {
            console.log("no parent");
            console.log(movedLayer);
            // If it has no parent, move the top-level layer
            STATE.layers.splice(insertIndex, 0, movedLayer);
            movedLayer.parent = null;
          }
        }

        console.log(STATE.layers);
        break;
      }
      // case "TRIGGER_PLUGIN": {
      //   const { pluginId } = args;
      //   const layer = STATE.layers.find(
      //     (layer) => layer.id === STATE.activeLayer
      //   );
      //   const plugin = layer.plugins.find((plugin) => plugin.id === pluginId);

      //   const controlValues = plugin.controls.reduce((cvAcc, control) => {
      //     cvAcc[control.id] = control.value;
      //     return cvAcc;
      //   }, {});

      //   const process = STATE.plugins.find(
      //     (x) => x.type === plugin.type
      //   ).process;

      //   process(controlValues, [layer.outputGeometry], layer.attributes);

      //   break;
      // }
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

    const order = Math.round(getBaseLog(5, Math.max(xRange, yRange)));
    const stepSize = state.adaptiveGrid ? 5 ** order / 20 : state.gridSize;
    state.gridSize = stepSize;
  });

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
      state.selectedGeometry = new Set();
    }

    if (e.key === "Backspace") {
      deleteGeometry(state);
    }
  });
}

function isDescendant(sourceLayer, targetId) {
  if (!sourceLayer.children) return false;

  for (const child of sourceLayer.children) {
    if (child.id === targetId) return true;
    if (isDescendant(child, targetId)) return true;
  }
  return false;
}
