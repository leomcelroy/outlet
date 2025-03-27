import { STATE } from "./index.js";

export function getLayerTree() {
  const parentLayers = STATE.layers.filter(layer => layer.parent === null);
  return parentLayers.map(layer => generateLayerTree(layer));
}

function generateLayerTree(layer, depth = 0) {
  const tree = {
    id: layer.id,
    name: layer.name,
    depth,
    children: [],
    geometry: layer.outputGeometry,
    attributes: layer.attributes,
    plugins: layer.plugins
  };

  if (layer.children && layer.children.length > 0) {
    layer.children.forEach(childId => {
      const childLayer = STATE.layers.find(l => l.id === childId);
      if (childLayer) {
        tree.children.push(generateLayerTree(childLayer, depth + 1));
      }
    });
  }

  return tree;
}

