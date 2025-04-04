import { STATE } from "../index.js";

export function getDefaultLayer() {
  // Find the top-most layer (one with no parent)
  const topLayer = STATE.layers.find((layer) => layer.parent === null);

  if (!topLayer) {
    // If no layer exists, create the default layer
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
    return STATE.layers[0];
  }

  return topLayer;
}
