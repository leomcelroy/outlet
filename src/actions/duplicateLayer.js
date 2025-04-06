import { STATE } from "../index.js";
import { evaluateAllLayers } from "../utils/evaluateAllLayers.js";
import { duplicateAndReidentify } from "../utils/duplicateAndReidentify.js";

export function duplicateLayer() {
  const activeLayer = STATE.layers.find((l) => l.id === STATE.activeLayer);
  if (!activeLayer) return;

  const points = STATE.geometries.filter((g) => g.layer === STATE.activeLayer);
  const oldParams = points.reduce((acc, curr) => {
    acc[curr.x] = STATE.params[curr.x];
    acc[curr.y] = STATE.params[curr.y];

    return acc;
  }, {});

  const { layers, geometries, params } = duplicateAndReidentify({
    layers: [activeLayer],
    geometries: STATE.geometries.filter((g) => g.layer === STATE.activeLayer),
    params: oldParams,
  });

  // Add the new layer
  STATE.layers.push(layers[0]);
  STATE.geometries.push(...geometries);
  STATE.params = { ...STATE.params, ...params };

  // Set the new layer as active
  STATE.dispatch({ type: "SET_ACTIVE_LAYER", layerId: layers[0].id });

  // Re-evaluate all layers
  evaluateAllLayers();
}
