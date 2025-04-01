import { STATE } from "../index.js";
import { evaluateAllLayers } from "../evaluateAllLayers.js";

export function movePath(action) {
  const { pathId, targetLayerId } = action;

  // Find the path in geometries
  const path = STATE.geometries.find((g) => g.id === pathId);

  if (!path) return STATE.layers;

  // Update the path's layerId
  path.layer = targetLayerId;

  // Re-evaluate all layers to update the rendering
  evaluateAllLayers();

  return STATE.layers;
}
