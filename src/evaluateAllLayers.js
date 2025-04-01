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
      return [processedPaths];
    }, layer.inputGeometry)
    .flat();
}

// Substitutes numeric parameters (from STATE.params) into geometry objects
function paramSub(geometries) {
  const geoMap = {};
  STATE.geometries.forEach((geo) => {
    geoMap[geo.id] = geo;
  });

  return geometries
    .filter((g) => g.type === "path")
    .map((g) => {
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
            data: g.data.map((cmd) => {
              const base = { ...cmd };
              if (cmd.cmd === "close") return base;

              if (cmd.point) {
                const point = geoMap[cmd.point];
                return {
                  ...base,
                  x: STATE.params[point.x],
                  y: STATE.params[point.y],
                };
              }

              if (cmd.control1) {
                const c1 = geoMap[cmd.control1];
                base.c1x = STATE.params[c1.x];
                base.c1y = STATE.params[c1.y];
              }

              if (cmd.control2) {
                const c2 = geoMap[cmd.control2];
                base.c2x = STATE.params[c2.x];
                base.c2y = STATE.params[c2.y];
              }

              return base;
            }),
          };
        default:
          return g;
      }
    });
}
