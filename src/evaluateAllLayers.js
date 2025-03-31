import { STATE } from "./index.js";

export function evaluateAllLayers() {
  // Clear out old geometry and attributes
  STATE.layers.forEach((layer) => {
    layer.outputGeometry = [];
    layer.attributes = {};
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
  const substitutedGeometry = paramSub(baseGeometry);

  // Build inputGeometry as an array of arrays:
  // [ [this layer's geometry], [child1's geometry], [child2's geometry], ... ]
  layer.inputGeometry = [substitutedGeometry];
  (layer.children || []).forEach((childId) => {
    const child = STATE.layers.find((l) => l.id === childId);
    if (child) {
      layer.inputGeometry.push(child.outputGeometry);
    }
  });

  // Apply plugins only to paths
  layer.outputGeometry = layer.plugins
    .reduce((currentGeo, plugin) => {
      const pluginDef = STATE.plugins.find((p) => p.type === plugin.type);
      if (!pluginDef || typeof pluginDef.process !== "function") {
        return currentGeo;
      }
      const controlValues = plugin.controls.reduce((acc, c) => {
        acc[c.id] = c.value;
        return acc;
      }, {});

      // Only pass paths to the plugin process function
      const paths = currentGeo.map((geoArray) =>
        geoArray.filter((g) => g.type === "path")
      );
      const processedPaths = pluginDef.process(controlValues, paths);

      // Replace processed paths in the original geometry
      return currentGeo.map((geoArray) => {
        const nonPaths = geoArray.filter((g) => g.type !== "path");
        return [...nonPaths, ...processedPaths];
      });
    }, layer.inputGeometry)
    .flat();
}

// Substitutes numeric parameters (from STATE.params) into geometry objects
function paramSub(geometries) {
  const geoMap = {};
  STATE.geometries.forEach((geo) => {
    geoMap[geo.id] = geo;
  });

  return geometries.map((g) => {
    switch (g.type) {
      case "point":
        return {
          ...g,
          x: STATE.params[g.x],
          y: STATE.params[g.y],
        };
      case "line":
        return {
          ...g,
          x1: STATE.params[geoMap[g.p1].x],
          y1: STATE.params[geoMap[g.p1].y],
          x2: STATE.params[geoMap[g.p2].x],
          y2: STATE.params[geoMap[g.p2].y],
        };
      case "path":
        return {
          ...g,
          data: g.data.map((cmd) => ({
            ...cmd,
            x: STATE.params[cmd.x],
            y: STATE.params[cmd.y],
            // Handle curve control points if present
            ...(cmd.x1 && { x1: STATE.params[cmd.x1] }),
            ...(cmd.y1 && { y1: STATE.params[cmd.y1] }),
            ...(cmd.x2 && { x2: STATE.params[cmd.x2] }),
            ...(cmd.y2 && { y2: STATE.params[cmd.y2] }),
          })),
        };
      default:
        return g;
    }
  });
}
