import { STATE, patchState } from "./index.js";

export function evaluateAllLayers() {
  // Reset all layers' output geometry
  STATE.layers.forEach((layer) => {
    layer.outputGeometry = [];
  });

  // Process parent layers first (those with no parent)
  const parentLayers = STATE.layers.filter((layer) => layer.parent === null);
  parentLayers.forEach((layer) => evaluateLayer(layer));

  patchState();
}

function evaluateLayer(layer) {
  // Get direct geometry for this layer
  const layerGeometry = STATE.geometries.filter(
    (geo) => geo.layer === layer.id
  );

  // Initialize currentGeometry with this layer's geometry
  layer.inputGeometry = [layerGeometry];

  // Recursively process child layers
  if (layer.children && layer.children.length > 0) {
    layer.children.forEach((childId) => {
      const childLayer = STATE.layers.find((l) => l.id === childId);
      if (childLayer) {
        // Recursively evaluate child layer
        evaluateLayer(childLayer);
        // Add child's currentGeometry array to parent's array
        layer.inputGeometry.push(...childLayer.outputGeometry);
      }
    });
  }

  const geoMap = {};
  STATE.geometries.forEach((geo) => {
    geoMap[geo.id] = geo;
  });

  const positionedGeometry = layer.inputGeometry.map((parent) =>
    parent.map((g) => {
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
      }
    })
  );

  // Apply plugins after all geometry is collected
  if (layer.plugins) {
    layer.plugins.forEach((plugin) => {
      const controlValues = {};
      plugin.controls.forEach((control) => {
        controlValues[control.id] = control.value;
      });

      // Flatten the geometry array for plugin processing
      console.log({ plugins: STATE.plugins, plugin });
      const process = STATE.plugins.find((x) => x.type === plugin.type).process;

      layer.outputGeometry = process(
        controlValues,
        positionedGeometry,
        layer.attributes
      );
    });
  }
}
