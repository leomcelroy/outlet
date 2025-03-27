import { STATE, patchState } from "./index.js";

export function evaluateAllLayers() {
  // Reset all layers' current geometry
  STATE.layers.forEach(layer => {
    layer.currentGeometry = [];
  });

  // Process parent layers first (those with no parent)
  const parentLayers = STATE.layers.filter(layer => layer.parent === null);
  parentLayers.forEach(layer => evaluateLayer(layer));

  patchState();
}

function evaluateLayer(layer) {
  // Get direct geometry for this layer
  const layerGeometry = STATE.geometries.filter(geo => geo.layer === layer.id);
  
  // Initialize currentGeometry with this layer's geometry
  layer.currentGeometry = [layerGeometry];

  // Recursively process child layers
  if (layer.children && layer.children.length > 0) {
    layer.children.forEach(childId => {
      const childLayer = STATE.layers.find(l => l.id === childId);
      if (childLayer) {
        // Recursively evaluate child layer
        evaluateLayer(childLayer);
        // Add child's currentGeometry array to parent's array
        layer.currentGeometry.push(...childLayer.currentGeometry);
      }
    });
  }

  // Apply plugins after all geometry is collected
  if (layer.plugins) {
    layer.plugins.forEach(plugin => {
      const controlValues = {};
      plugin.controls.forEach(control => {
        controlValues[control.id] = control.value;
      })

      // Flatten the geometry array for plugin processing
      console.log({ plugins: STATE.plugins, plugin})
      const process = STATE.plugins.find(x => x.id === plugin.id).process;
      process(controlValues, layer.currentGeometry, layer.attributes);
    });
  }
}


