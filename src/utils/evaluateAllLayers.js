import { STATE } from "../index.js";
import { convertGraphToPolylines } from "./convertGraphToPolylines.js";

export function evaluateAllLayers() {
  // Clear out old geometry and attributes
  STATE.layers.forEach((layer) => {
    layer.outputGeometry = [];
    layer.inputGeometry = [];
  });

  // Evaluate top-level layers first
  const topLevelLayers = STATE.layers.filter((layer) => !layer.parent);
  topLevelLayers.forEach((layer) => evaluateLayer(layer));
}

function evaluateLayer(layer) {
  // Evaluate children first so their outputGeometry is ready
  (layer.children || []).forEach((childId) => {
    const child = STATE.layers.find((l) => l.id === childId);
    if (child) evaluateLayer(child);
  });

  // Collect this layer's own geometry, parameter-substitute it
  const baseGeometry = STATE.geometries.filter((g) => g.layer === layer.id);
  const polylines = convertGraphToPolylines(baseGeometry, STATE.params);
  const substitutedGeometry = {
    polylines,
    attributes: {},
  };

  // Build inputGeometry as an array of arrays:
  // [ [this layer's geometry], [child1's geometry], [child2's geometry], ... ]
  layer.inputGeometry = [substitutedGeometry];

  (layer.children || []).forEach((childId) => {
    const child = STATE.layers.find((l) => l.id === childId);
    if (child) {
      layer.inputGeometry.push(...child.outputGeometry);
    }
  });

  // Apply plugins only to paths
  layer.outputGeometry = layer.inputGeometry;
  layer.plugins
    .filter((plugin) => plugin.enabled)
    .forEach((plugin) => {
      const pluginDef = STATE.plugins.find((p) => p.type === plugin.type);
      if (!pluginDef) return;

      const controlValues = plugin.controls.reduce((acc, c) => {
        acc[c.id] = c.value;
        return acc;
      }, {});

      const processedGeometry = pluginDef.process(
        controlValues,
        layer.outputGeometry
      );

      layer.outputGeometry = processedGeometry;
    });
}
