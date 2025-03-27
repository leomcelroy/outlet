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
import { evaluateAllLayers } from "./evaluateAllLayers.js";

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
      plugins: [testDup.init({ offset: 1 })],
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
  plugins: [fill, stroke, testDup],
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
          plugins: [testDup.init({ offset: 1 })],
          attributes: {},
          outputGeometry: [],
          inputGeometry: [],
        });
        break;
      }
      case "OPEN_PLUGIN_MODAL": {
        const { pluginId } = args;
        STATE.openPluginModal = pluginId;

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

  addPanZoom(sketchBoard);
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
